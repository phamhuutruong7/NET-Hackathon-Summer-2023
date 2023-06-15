import * as pulumi from '@pulumi/pulumi';
import * as resources from '@pulumi/azure-native/resources';
import * as authorization from '@pulumi/azure-native/authorization';
import * as web from '@pulumi/azure-native/web';
import * as storage from '@pulumi/azure-native/storage';

import * as Appsfactory from './../lib';

import * as pulumiConfig from './../pulumi.json';

let config = new pulumi.Config();
let env = config.require('env');
let tenantId = config.require('tenantId');
let subscriptionId = config.require('subscriptionId');
let servicePrincipalId = config.require('servicePrincipalId');
let project = config.require('project');
let projectShort = config.require('projectShort');
let customer = config.require('customer');
let customerShort = config.require('customerShort');
let appServicePlanApiConfig = config.requireObject<Appsfactory.WebApp.AppServicePlanConfig>('appServicePlanApi');
let storageAccountPlanConfig = config.requireObject<Appsfactory.Storage.StorageAccountPlanConfig>('storagePlan');
let namePrefix = `${customerShort}-${projectShort}`;
let namePrefixCleaned = namePrefix.replace(/-/g, '');

let tags: { [key: string]: pulumi.Input<string> } = {
  Project: project, // mandatory
  Environment: env, // mandatory
  Source: 'Pulumi', // mandatory
  Customer: customer, // optional
  Creator: 'Appsfactory', // optional (helpful if you work in a customers tenant / subscription)
  // add more tags if necessary
};

const baseModel: Appsfactory.Base.BaseModel = {
  env,
  namePrefix,
  tags,
  tenantId,
  subscriptionId,
  servicePrincipalId,
};

const rgDefault = new resources.ResourceGroup('rgDefault', {
  resourceGroupName: `${namePrefix}-${env}`,
  tags,
});

const plan = new web.AppServicePlan(`appServicePlan${projectShort}`, {
  resourceGroupName: rgDefault.name,
  name: `${namePrefix}-plan-${projectShort}-${env}`,
  kind: 'Linux',
  reserved: true,
  sku: {
    name: appServicePlanApiConfig.name,
    tier: appServicePlanApiConfig.tier,
    capacity: appServicePlanApiConfig.capacity,
  },

  tags,
});

const webApp = new web.WebApp(
  `webApp${projectShort}`,
  {
    resourceGroupName: rgDefault.name,
    name: `${namePrefix}-webapp-${projectShort}-${env}`,
    serverFarmId: plan.id,
    siteConfig: {
      appSettings: [
        { name: "OpenWeatherSettings__BaseUrl", value: "https://api.openweathermap.org/data/2.5/" },
        { name: "OpenWeatherSettings__ApiKey", value: "fcadd28326c90c3262054e0e6ca599cd" },
        { name: "OpenWeatherSettings__DefaultCountryCode", value: "de" },
        { name: "OpenWeatherSettings__Units", value: "metric" },
        { name: "OpenAIServiceOptions__ApiKey", value: "e8cdcbbbe31b4c43b2eff98f3a6bd18d" },
        { name: "OpenAIServiceOptions__DeploymentId", value: "af-ai-text-summarizer-model-turbo" },
        { name: "OpenAIServiceOptions__ResourceName", value: "af-ai-text-summarizer-openai" },
        { name: "OpenAIServiceOptions__ProviderType", value: "Azure" },
      ],
      alwaysOn: true,
      linuxFxVersion: `DOTNET|6.0`,
    },
    httpsOnly: true,

    tags,
  }
);

const storageResult = Appsfactory.Storage.createStorageAccount(
  storageAccountPlanConfig,
  new Appsfactory.Storage.CreateStorageAccountModel({
    ...baseModel,
    resourceGroupName: rgDefault.name,
    accountName: `${namePrefix}sa${projectShort}${env}`,
    minimumTlsVersion: storage.MinimumTlsVersion.TLS1_2,
    allowBlobPublicAccess: false,
    enableHttpsTrafficOnly: true,
    components: [
      { componentType: Appsfactory.Storage.StorageComponentType.Blob, pulumiName: 'saDefaultBlobContainer', resourceName: `${namePrefix}sablob${projectShort}${env}` },
    ],
  })
);