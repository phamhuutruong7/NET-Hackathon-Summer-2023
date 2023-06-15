import * as pulumi from '@pulumi/pulumi';
import * as storage from '@pulumi/azure-native/storage';
import * as web from '@pulumi/azure-native/web';
import * as keyvault from '@pulumi/azure-native/keyvault';
import * as authorization from '@pulumi/azure-native/authorization';
import * as managedidentity from '@pulumi/azure-native/managedidentity';
import * as cdn from '@pulumi/azure-native/cdn';
import { input } from '@pulumi/azure-native/types';

import * as models from './models';
import * as baseLib from './../base';
import * as keyvaultLib from './../keyvault';
import * as storageLib from './../storage';
import * as authorizationLib from './../authorization';

export function createWebApp(
  config: models.AppServicePlanConfig,
  input: models.CreateWebAppModel,
  inputAppServicePlan?: models.CreateAppServicePlanModel | undefined
): models.IWebAppResult {
  // use default if not defined
  if (inputAppServicePlan === undefined) {
    inputAppServicePlan = new models.CreateAppServicePlanModel();
  }
  // api-app -> ApiApp
  const namePlanPascalCase = baseLib.toPascalCase(input.serviceName);

  // app service plan
  // https://www.pulumi.com/docs/reference/pkg/azure-native/web/appserviceplan/
  const plan = new web.AppServicePlan(`appServicePlan${namePlanPascalCase}`, {
    resourceGroupName: input.resourceGroupName,
    name: `${input.namePrefix}-plan-${input.serviceName}-${input.env}`,
    kind: inputAppServicePlan.kind,
    reserved: inputAppServicePlan.reserved,
    sku: {
      name: config.name,
      tier: config.tier,
      capacity: config.capacity,
    },

    tags: inputAppServicePlan.tags,
  });

  return addWebApp(input, plan);
}

export function addWebApp(input: models.CreateWebAppModel, appServicePlan: web.AppServicePlan): models.IWebAppResult {
  const serviceNamePascalCase = baseLib.toPascalCase(input.serviceName);

  // create user assigned managed identity
  const identity = new managedidentity.UserAssignedIdentity(`identity${serviceNamePascalCase}`, {
    resourceGroupName: input.resourceGroupName,
    resourceName: `${input.namePrefix}-identity-${input.serviceName}-${input.env}`,

    tags: input.tags,
  });

  // key vault - add a keyvault per service / consumer, don't reuse keyvault for multiple consumer
  const keyVault = keyvaultLib.createKeyVault(
    new keyvaultLib.CreateKeyVaultModel({
      env: input.env,
      namePrefix: input.namePrefix,
      tenantId: input.tenantId,
      tags: input.tags,
      serviceName: input.serviceName,
      resourceGroupName: input.resourceGroupName,
      subscriptionId: input.subscriptionId,
      servicePrincipalId: input.servicePrincipalId,
    })
  );

  //Create key vault secrets
  createSecrets(input, keyVault.name);

  const appSettings: { name: string; value: pulumi.Input<string> }[] = input.additionalAppsettings!.concat([
    {
      name: 'AzureServicesAuthConnectionString',
      value: pulumi.interpolate`RunAs=App;AppId=${identity.clientId}`,
    },
    {
      name: 'ManagedIdentityClientId',
      value: pulumi.interpolate`${identity.clientId}`,
    },
    {
      name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE',
      value: 'false',
    },
    {
      name: 'ASPNETCORE_ENVIRONMENT',
      value: input.aspnetCoreEnvironment,
    },
    {
      name: 'DOCKER_ENABLE_CI',
      value: 'false',
    },
    {
      name: 'DOCKER_REGISTRY_SERVER_URL',
      value: pulumi.interpolate`https://${input.acr.loginServer}`,
    },
    {
      name: 'APPLICATIONINSIGHTS_CONNECTION_STRING',
      value: input.appInsightsConnectionString,
    },
    {
      name: 'KeyVaultName',
      value: keyVault.name,
    },
    {
      name: 'AzureKeyVaultRepositoryOptions__Name',
      value: keyVault.name,
    },
    {
      name: 'AzureKeyVaultRepositoryOptions__ManagedIdentityId',
      value: pulumi.interpolate`${identity.clientId}`,
    }
  ]);

  let connectionStrings: pulumi.Input<input.web.ConnStringInfoArgs>[] = [];

  if (input.sqlResult != null) {
    connectionStrings = [
      {
        connectionString: input.sqlResult.connectionString,
        type: web.ConnectionStringType.SQLAzure,
        name: 'SqlConnectionString',
      },
    ];
  }

  // web app
  // https://www.pulumi.com/docs/reference/pkg/azure-native/web/webapp/
  const webApp = new web.WebApp(
    `webApp${serviceNamePascalCase}`,
    {
      resourceGroupName: input.resourceGroupName,
      name: `${input.namePrefix}-webapp-${input.serviceName}-${input.env}`,
      serverFarmId: appServicePlan.id,
      siteConfig: {
        // NOTE: currently you need azure cli version 2.22.1, bc there is an issue with 'acrUseManagedIdentityCreds'
        // in the API! This should be fixed in version 3.x
        // https://github.com/Azure/azure-cli/issues/18956
        acrUseManagedIdentityCreds: true,
        acrUserManagedIdentityID: identity.clientId,
        appSettings,
        connectionStrings,
        alwaysOn: input.alwaysOn,
        linuxFxVersion: pulumi.interpolate`DOCKER|${input.imageName}`,
        ftpsState: web.FtpsState.Disabled,
        healthCheckPath: '/healthz',
      },
      httpsOnly: true,
      identity: {
        // identity assignment (and propagation in Azure AD takes up to 10 minutes to take effect)
        type: web.ManagedServiceIdentityType.SystemAssigned_UserAssigned,
        userAssignedIdentities: authorizationLib.buildUserAssignedIdentities(identity.id),
      },

      tags: input.tags,
    },
    {
      ignoreChanges: ['siteConfig.linuxFxVersion'],
    }
  );

  //const webAppPrincipalId = webApp.identity.apply(i => i?.principalId!);
  const identityPrincipalId = identity.principalId.apply((id) => id);

  // Acr: add rbac role for identity to container registry pull permissions
  authorizationLib.addAcrPull(
    `webApp${serviceNamePascalCase}UserIdentity`,
    input.subscriptionId,
    identityPrincipalId,
    input.acr.id,
    authorization.PrincipalType.ServicePrincipal
  );

  // keyvault: assign 'Officer' roles to the team
  input.teamGroupObjectIdArray.forEach((objectId) => {
    authorizationLib.addKeyVaultOfficer(
      `teamToKeyVault${serviceNamePascalCase}`,
      input.subscriptionId,
      objectId,
      keyVault.id,
      authorization.PrincipalType.Group
    );
  });

  // keyvault: assign 'User' roles to web app
  //addKeyVaultUser(`webapp${serviceNamePascalCase}SystemIdentityToKeyVault`, webAppPrincipalId, keyVault.id, authorization.PrincipalType.ServicePrincipal)
  authorizationLib.addKeyVaultUser(
    `webapp${serviceNamePascalCase}UserIdentityToKeyVault`,
    input.subscriptionId,
    identityPrincipalId,
    keyVault.id,
    authorization.PrincipalType.ServicePrincipal
  );

  // allow the web app to retrieve certificates from key vault (there is no certificate read only permission available)
  authorizationLib.addKeyVaultCertificateOfficer(
    `webapp${serviceNamePascalCase}UserIdentityToKeyVault`,
    input.subscriptionId,
    identityPrincipalId,
    keyVault.id,
    authorization.PrincipalType.ServicePrincipal
  );

  // allow azure dev ops pipeline to access the key vault in order to perform integration tests :(
  authorizationLib.addKeyVaultCertificateOfficer(
    `webapp${serviceNamePascalCase}ServicePrincipalToKeyVault`,
    input.subscriptionId,
    input.servicePrincipalId,
    keyVault.id,
    authorization.PrincipalType.ServicePrincipal
  );

  return {
    plan: appServicePlan,
    webApp,
    keyVault,
  };
}

export function createFunctionAppWithDockerDeployment(
  config: models.AppServicePlanConfig,
  input: models.CreateWebAppModel,
  inputAppServicePlan?: models.CreateAppServicePlanModel | undefined
): models.IWebAppResult {
  // use default if not defined
  if (inputAppServicePlan === undefined) {
    inputAppServicePlan = new models.CreateAppServicePlanModel();
  }

  // api-app -> ApiApp
  const serviceNamePascalCase = baseLib.toPascalCase(input.serviceName);

  // app service plan
  // https://www.pulumi.com/docs/reference/pkg/azure-native/web/appserviceplan/
  const plan = new web.AppServicePlan(`appServicePlan${serviceNamePascalCase}`, {
    resourceGroupName: input.resourceGroupName,
    name: `${input.namePrefix}-plan-${input.serviceName}-${input.env}`,
    kind: inputAppServicePlan.kind,
    reserved: inputAppServicePlan.reserved,
    sku: {
      name: config.name,
      tier: config.tier,
    },

    tags: input.tags,
  });

  // create user assigned managed identity
  const identity = new managedidentity.UserAssignedIdentity(`identity${serviceNamePascalCase}`, {
    resourceGroupName: input.resourceGroupName,
    resourceName: `${input.namePrefix}-identity-${input.serviceName}-${input.env}`,

    tags: input.tags,
  });

  // key vault - add a keyvault per service / consumer, don't reuse keyvault for multiple consumer
  const keyVault = keyvaultLib.createKeyVault(
    new keyvaultLib.CreateKeyVaultModel({
      ...input,
    })
  );

  //Create key vault secrets
  createSecrets(input, keyVault.name);

  const appSettings: { name: string; value: pulumi.Input<string> }[] = input.additionalAppsettings!.concat([
    { name: 'FUNCTIONS_WORKER_RUNTIME', value: input.workerRuntime || 'dotnet' },
    { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' },
    { name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE', value: 'false' },
    {
      name: 'AzureServicesAuthConnectionString',
      value: pulumi.interpolate`RunAs=App;AppId=${identity.clientId}`,
    },
    {
      name: 'ManagedIdentityClientId',
      value: pulumi.interpolate`${identity.clientId}`,
    },
    {
      name: 'ASPNETCORE_ENVIRONMENT',
      value: input.aspnetCoreEnvironment,
    },
    {
      name: 'DOCKER_ENABLE_CI',
      value: 'false',
    },
    {
      name: 'DOCKER_REGISTRY_SERVER_URL',
      value: pulumi.interpolate`https://${input.acr.loginServer}`,
    },
    {
      name: 'APPLICATIONINSIGHTS_CONNECTION_STRING',
      value: input.appInsightsConnectionString,
    },
    {
      name: 'KeyVaultName',
      value: keyVault.name,
    }
  ]);

  // Remove this storage account and connection string settings if you do not need blob trigger
  if (input.storageResult != null) {
    appSettings.push({ name: 'AZURE_CLIENT_ID', value: pulumi.interpolate`${identity.clientId}` });
    appSettings.push({ name: 'AzureWebJobsStorage__credential', value: 'managedidentity' });
    appSettings.push({ name: 'AzureWebJobsStorage__clientId', value: pulumi.interpolate`${identity.clientId}` });
    appSettings.push({ name: 'AzureWebJobsStorage__tenantId', value: input.tenantId });
    appSettings.push({ name: 'AzureWebJobsStorage__accountName', value: input.storageResult.storageAccount.name });
    appSettings.push({
      name: 'AzureWebJobsStorage__blobServiceUri',
      value: `https://${input.storageResult.storageAccount.name}.blob.core.windows.net`,
    });
    appSettings.push({
      name: 'AzureWebJobsStorage__queueServiceUri',
      value: `https://${input.storageResult.storageAccount.name}.queue.core.windows.net`,
    });
    appSettings.push({
      name: 'AzureWebJobsStorage__tableServiceUri',
      value: `https://${input.storageResult.storageAccount.name}.table.core.windows.net`,
    });

    // Storage: add rbac roles for identity, which are needed for the function app.
    const identityPrincipalId = identity.principalId.apply((id) => id);
    authorizationLib.addStorageRbacForAppServices(
      `${serviceNamePascalCase}${input.env}`,
      input.subscriptionId,
      identityPrincipalId,
      input.storageResult.storageAccount.id,
      authorization.PrincipalType.ServicePrincipal
    );
  }

  let sqlConnectionStrings: pulumi.Input<input.web.ConnStringInfoArgs>[] = [];
  if (input.sqlResult != null) {
    sqlConnectionStrings = [
      {
        connectionString: input.sqlResult.connectionString,
        type: web.ConnectionStringType.SQLAzure,
        name: 'SqlConnectionString',
      },
    ];
  }

  let siteConfig: any = {
    acrUseManagedIdentityCreds: true,
    acrUserManagedIdentityID: identity.clientId,
    appSettings,
    connectionStrings: sqlConnectionStrings,
    linuxFxVersion: input.imageName,
    ftpsState: web.FtpsState.Disabled,
  };

  //Add alwaysOn property if plan is not consumption. For consumption plan there is no need for alwaysOn as the system takes care of waking up your functions whenever they need to run
  if (config.name.toLowerCase() != 'y1') {
    siteConfig.alwaysOn = input.env == 'prod';
  }

  const functionApp = new web.WebApp(
    `functionApp${serviceNamePascalCase}`,
    {
      resourceGroupName: input.resourceGroupName,
      name: `${input.namePrefix}-fa-${input.serviceName}-${input.env}`,
      serverFarmId: plan.id,
      kind: 'FunctionApp',
      siteConfig,
      httpsOnly: true,
      identity: {
        // identity assignment (and propagation in Azure AD takes up to 10 minutes to take effect)
        type: web.ManagedServiceIdentityType.SystemAssigned_UserAssigned,
        userAssignedIdentities: authorizationLib.buildUserAssignedIdentities(identity.id),
      },

      tags: input.tags,
    },
    {
      ignoreChanges: ['siteConfig.linuxFxVersion'],
    }
  );

  const identityPrincipalId = identity.principalId.apply((id) => id);

  // Acr: add rbac role for identity to container registry pull permissions
  authorizationLib.addAcrPull(
    `functionApp${serviceNamePascalCase}UserIdentity`,
    input.subscriptionId,
    identityPrincipalId,
    input.acr.id,
    authorization.PrincipalType.ServicePrincipal
  );

  // keyvault: assign 'Officer' roles to the team
  input.teamGroupObjectIdArray.forEach((teamGroupObjectId) => {
    authorizationLib.addKeyVaultOfficer(
      `teamToKeyVault${serviceNamePascalCase}`,
      input.subscriptionId,
      teamGroupObjectId,
      keyVault.id,
      authorization.PrincipalType.Group
    );
  });

  //For dotnet-isolated functions we found that user assigned identity does not work when we try to read from keyvault.
  //So we need to use function system assigned identity to assign role on keyvault to access keyvault's secrets
  const functionAppPrincipalId = functionApp.identity.apply((i) => i?.principalId!);

  authorizationLib.addKeyVaultOfficer(
    `functionApp${serviceNamePascalCase}UserIdentityToKeyVaultOfficer`,
    input.subscriptionId,
    functionAppPrincipalId,
    keyVault.id,
    authorization.PrincipalType.ServicePrincipal
  );

  return {
    plan,
    webApp: functionApp,
    keyVault,
  };
}

export function createFunctionApp(
  config: models.AppServicePlanConfig,
  input: models.CreateWebAppModel,
  inputAppServicePlan?: models.CreateAppServicePlanModel | undefined,
  storageAccountComponents?: storageLib.StorageComponent[] | undefined
): models.IWebAppResult {
  // use default if not defined
  if (inputAppServicePlan === undefined) {
    inputAppServicePlan = new models.CreateAppServicePlanModel();
  }

  // api-app -> ApiApp
  const serviceNamePascalCase = baseLib.toPascalCase(input.serviceName);

  // app service plan
  // https://www.pulumi.com/docs/reference/pkg/azure-native/web/appserviceplan/
  const plan = new web.AppServicePlan(`appServicePlan${serviceNamePascalCase}`, {
    resourceGroupName: input.resourceGroupName,
    name: `${input.namePrefix}-plan-${input.serviceName}-${input.env}`,
    kind: inputAppServicePlan.kind,
    reserved: inputAppServicePlan.reserved,
    sku: {
      name: config.name,
      tier: config.tier,
    },

    tags: input.tags,
  });

  // create user assigned managed identity
  const identity = new managedidentity.UserAssignedIdentity(`identity${serviceNamePascalCase}`, {
    resourceGroupName: input.resourceGroupName,
    resourceName: `${input.namePrefix}-identity-${input.serviceName}-${input.env}`,

    tags: input.tags,
  });

  // key vault - add a keyvault per service / consumer, don't reuse keyvault for multiple consumer
  const keyVault = keyvaultLib.createKeyVault(
    new keyvaultLib.CreateKeyVaultModel({
      ...input,
    })
  );

  //Create key vault secrets
createSecrets(input, keyVault.name);

  if (!input.storageResult) {
    const functionStorageResult = storageLib.createStorageAccount(
      {
        sku: storage.SkuName.Standard_LRS,
        kind: storage.Kind.StorageV2,
      } as storageLib.StorageAccountPlanConfig,
      new storageLib.CreateStorageAccountModel({
        ...input.getBaseModel(),
        pulumiName: `storage${serviceNamePascalCase}`,
        resourceGroupName: input.resourceGroupName,
        accountName: 'storage',
        minimumTlsVersion: storage.MinimumTlsVersion.TLS1_2,
        allowBlobPublicAccess: false,
        enableHttpsTrafficOnly: true,
        components: storageAccountComponents
      })
    );
    input.storageResult = functionStorageResult;
  }

  // Storage: add rbac roles for identity, which are needed for the function app.
  const identityPrincipalId = identity.principalId.apply((id) => id);
  authorizationLib.addStorageRbacForAppServices(
    `${serviceNamePascalCase}${input.env}`,
    input.subscriptionId,
    identityPrincipalId,
    input.storageResult.storageAccount.id,
    authorization.PrincipalType.ServicePrincipal
  );

  let appSettings: { name: string; value: pulumi.Input<string> }[] = input.additionalAppsettings!.concat([
    { name: 'FUNCTIONS_WORKER_RUNTIME', value: input.workerRuntime || 'dotnet' },
    { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' },
    { name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE', value: 'false' },
    { name: 'AzureServicesAuthConnectionString', value: pulumi.interpolate`RunAs=App;AppId=${identity.clientId}` },
    { name: 'ManagedIdentityClientId', value: pulumi.interpolate`${identity.clientId}` },
    { name: 'ASPNETCORE_ENVIRONMENT', value: input.aspnetCoreEnvironment },
    { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: input.appInsightsConnectionString },
    { name: 'KeyVaultName', value: keyVault.name },
    { name: 'AZURE_CLIENT_ID', value: pulumi.interpolate`${identity.clientId}` },
    { name: 'AzureWebJobsStorage__credential', value: 'managedidentity' },
    { name: 'AzureWebJobsStorage__clientId', value: pulumi.interpolate`${identity.clientId}` },
    { name: 'AzureWebJobsStorage__tenantId', value: input.tenantId },
    { name: 'AzureWebJobsStorage__accountName', value: input.storageResult.storageAccount.name },
    {
      name: 'AzureWebJobsStorage__blobServiceUri',
      value: pulumi.interpolate`https://${input.storageResult.storageAccount.name}.blob.core.windows.net`,
    },
    {
      name: 'AzureWebJobsStorage__queueServiceUri',
      value: pulumi.interpolate`https://${input.storageResult.storageAccount.name}.queue.core.windows.net`,
    },
    {
      name: 'AzureWebJobsStorage__tableServiceUri',
      value: pulumi.interpolate`https://${input.storageResult.storageAccount.name}.table.core.windows.net`,
    }
  ]);
  if (input.dockerDeployment) {
    appSettings.push({ name: 'DOCKER_ENABLE_CI', value: 'false' });
    appSettings.push({ name: 'DOCKER_REGISTRY_SERVER_URL', value: pulumi.interpolate`https://${input.acr.loginServer}` });
  } else {
    appSettings.push({ name: 'WEBSITE_RUN_FROM_PACKAGE', value: '1' });
  }

  let sqlConnectionStrings: pulumi.Input<input.web.ConnStringInfoArgs>[] = [];

  if (input.sqlResult != null) {
    sqlConnectionStrings = [
      {
        connectionString: input.sqlResult.connectionString,
        type: web.ConnectionStringType.SQLAzure,
        name: 'SqlConnectionString',
      },
    ];
  }

  let siteConfig: input.web.SiteConfigArgs = {
    acrUseManagedIdentityCreds: true,
    acrUserManagedIdentityID: identity.clientId,
    appSettings,
    connectionStrings: sqlConnectionStrings,
    linuxFxVersion: input.imageName,
    ftpsState: web.FtpsState.Disabled,
  };

  //Add alwaysOn property if plan is not consumption. For consumption plan there is no need for alwaysOn as the system takes care of waking up your functions whenever they need to run
  if (config.name.toLowerCase() != 'y1') {
    siteConfig.alwaysOn = input.env == 'prod';
  }

  const functionApp = new web.WebApp(
    `functionApp${serviceNamePascalCase}`,
    {
      resourceGroupName: input.resourceGroupName,
      name: `${input.namePrefix}-fa-${input.serviceName}-${input.env}`,
      serverFarmId: plan.id,
      kind: 'FunctionApp',
      siteConfig,
      httpsOnly: true,
      identity: {
        // identity assignment (and propagation in Azure AD takes up to 10 minutes to take effect)
        type: web.ManagedServiceIdentityType.SystemAssigned_UserAssigned,
        userAssignedIdentities: authorizationLib.buildUserAssignedIdentities(identity.id),
      },

      tags: input.tags,
    },
    {
      ignoreChanges: ['siteConfig.linuxFxVersion'],
    }
  );

  // Only for docker deployments
  // Acr: add rbac role for identity to container registry pull permissions
  if (input.dockerDeployment) {
    const identityPrincipalId = identity.principalId.apply((id) => id);
    authorizationLib.addAcrPull(
      `functionApp${serviceNamePascalCase}UserIdentity`,
      input.subscriptionId,
      identityPrincipalId,
      input.acr.id,
      authorization.PrincipalType.ServicePrincipal
    );
  }

  // keyvault: assign 'Officer' roles to the team
  input.teamGroupObjectIdArray.forEach((teamGroupObjectId) => {
    authorizationLib.addKeyVaultOfficer(
      `teamToKeyVault${serviceNamePascalCase}`,
      input.subscriptionId,
      teamGroupObjectId,
      keyVault.id,
      authorization.PrincipalType.Group
    );
  });

  //For dotnet-isolated functions we found that user assigned identity does not work when we try to read from keyvault.
  //So we need to use function system assigned identity to assign role on keyvault to access keyvault's secrets
  const functionAppPrincipalId = functionApp.identity.apply((i) => i?.principalId!);

  authorizationLib.addKeyVaultOfficer(
    `functionApp${serviceNamePascalCase}UserIdentityToKeyVaultOfficer`,
    input.subscriptionId,
    functionAppPrincipalId,
    keyVault.id,
    authorization.PrincipalType.ServicePrincipal
  );

  return {
    plan,
    webApp: functionApp,
    keyVault,
  };
}

//Create static web app in azure storage account and add CDN in front of it
export function createStaticSite(
  config: models.StaticSiteConfig,
  input: models.CreateStaticSiteModel
): models.ICreateStaticSiteAndCdnResult {
  const namePrefixCleaned = input.namePrefix.replace(/-/g, '');

  //Storage account
  const storageAccount = new storage.StorageAccount(`${namePrefixCleaned}storagesite${input.env}`, {
    resourceGroupName: input.resourceGroupName,
    accountName: `${namePrefixCleaned}storagesite${input.env}`,
    sku: {
      name: storage.SkuName.Standard_LRS,
    },
    kind: storage.Kind.StorageV2,
    accessTier: storage.AccessTier.Hot,
    allowBlobPublicAccess: false,
    enableHttpsTrafficOnly: true,
    minimumTlsVersion: storage.MinimumTlsVersion.TLS1_2,
    tags: input.tags,
  });

  // Create the static website with configuration, inside the storage account
  var staticSite = new storage.StorageAccountStaticWebsite(`${input.namePrefix}-${input.siteName}-${input.env}-site-config`, {
    resourceGroupName: input.resourceGroupName,
    accountName: storageAccount.name,
    error404Document: `index.html`,
    indexDocument: `index.html`,
  });

  //Add roles to service principle used in azure devops, so we can use azure copy files and publish in azure storage from the azure devops
  authorizationLib.addStorageContributor(
    `${input.namePrefix}-${input.siteName}-${input.env}-`,
    input.subscriptionId,
    input.servicePrincipalId,
    storageAccount.id,
    authorization.PrincipalType.ServicePrincipal
  );

  const hostName = storageAccount.primaryEndpoints.web.apply((x) => {
    return new URL(x).hostname;
  });

  const profileName = `${input.namePrefix}-cdn-profile-${input.siteName}-${input.env}`;
  const endpointName = `${input.namePrefix}-cdn-endpoint-${input.siteName}-${input.env}`;

  // CDN Profile for caching
  const profile = new cdn.Profile(`${profileName}`, {
    profileName: `${profileName}`,
    location: 'Global',
    resourceGroupName: input.resourceGroupName,
    sku: {
      name: config.sku, //Change as per the requirements
    },
    tags: input.tags,
  });

  // CDN endpoint for caching
  // Wait for atleast 10 mins once created as it take time to populate
  var cdnEndpoint = new cdn.Endpoint(`${endpointName}`, {
    endpointName: `${endpointName}`,
    location: 'Global',
    contentTypesToCompress: config.contentTypesToCompress,
    isCompressionEnabled: true,
    isHttpAllowed: false,
    isHttpsAllowed: true,
    origins: [
      {
        enabled: true,
        hostName,
        originHostHeader: hostName,
        httpsPort: 443,
        name: storageAccount.name,
      },
    ],
    profileName: profile.name,
    queryStringCachingBehavior: cdn.QueryStringCachingBehavior.UseQueryString,
    resourceGroupName: input.resourceGroupName,
    tags: input.tags,
  });

  return {
    storageAccount,
    staticSite,
    cdnEndpoint,
  };
}

function createSecrets(input: models.CreateWebAppModel, keyVaultName: pulumi.Output<string>) {
  let secretsToAdd = input.secrets || [];

  for(var i = 0; i < secretsToAdd.length; i++) {
    const kvSecret = keyvaultLib.createKeyVaultSecret(new keyvaultLib.CreateSecretModel({
      ...input,
      keyVaultName: keyVaultName,
      pulumiResourceName: `${secretsToAdd[i].name}-${input.serviceName}`,
      secretName: secretsToAdd[i].name,
      secretValue: secretsToAdd[i].value
    }))
  }
} 