import * as pulumi from '@pulumi/pulumi';
import * as storage from '@pulumi/azure-native/storage';
import * as models from './models';

export function createStorageAccount(
  config: models.StorageAccountPlanConfig,
  input: models.CreateStorageAccountModel
): models.ICreateStorageAccountResult {
  const storageAccount = new storage.StorageAccount(input.pulumiName || 'saDefault', {
    resourceGroupName: input.resourceGroupName,
    accountName: input.buildServiceName('storage', true),
    sku: {
      name: config.sku,
    },
    kind: config.kind,
    accessTier: storage.AccessTier.Hot,
    allowBlobPublicAccess: input.allowBlobPublicAccess,
    enableHttpsTrafficOnly: input.enableHttpsTrafficOnly,
    minimumTlsVersion: input.minimumTlsVersion,

    tags: input.tags,
  });

  const storageAccountKeys = pulumi.all([input.resourceGroupName, storageAccount.name]).apply(([resourceGroupName, accountName]) =>
    storage.listStorageAccountKeys({
      resourceGroupName,
      accountName,
    })
  );

  const containerDeleteRetentionPolicy = config.containerDeleteRetentionPolicyDays
    ? {
        days: config.containerDeleteRetentionPolicyDays,
        enabled: true,
      }
    : undefined;

  const deleteRetentionPolicy = config.deleteRetentionPolicyDays
    ? {
        days: config.deleteRetentionPolicyDays,
        enabled: true,
      }
    : undefined;

  const restorePolicy = config.restorePolicyDays
    ? {
        days: config.restorePolicyDays,
        enabled: true,
      }
    : undefined;

  new storage.BlobServiceProperties(`${input.pulumiName}storagesiteBlobProperties${input.env}`, {
    accountName: storageAccount.name,
    blobServicesName: 'default',
    resourceGroupName: input.resourceGroupName,
    containerDeleteRetentionPolicy,
    deleteRetentionPolicy,
    restorePolicy,
    isVersioningEnabled: true,
    changeFeed: {
      enabled: true,
    },
  });

  const connectionString = pulumi.interpolate`DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccountKeys.keys[0].value};EndpointSuffix=core.windows.net`;

  if (input.components) {
    input.components.forEach(function (component) {
      switch (component.componentType) {
        case models.StorageComponentType.Blob:
          const blobComponent = component as models.BlobStorageComponent;
          new storage.BlobContainer(component.pulumiName!, {
            accountName: storageAccount.name,
            containerName: component.resourceName,
            resourceGroupName: input.resourceGroupName,
            publicAccess: blobComponent.accessType,
            denyEncryptionScopeOverride: blobComponent.denyEncryptionScopeOverride,
            defaultEncryptionScope: blobComponent.defaultEncryptionScope,
          });
          break;

        case models.StorageComponentType.Queue:
          new storage.Queue(component.pulumiName!, {
            accountName: storageAccount.name,
            queueName: component.resourceName,
            resourceGroupName: input.resourceGroupName,
          });
          break;
        case models.StorageComponentType.Table:
          new storage.Table(component.pulumiName!, {
            accountName: storageAccount.name,
            tableName: component.resourceName,
            resourceGroupName: input.resourceGroupName,
          });
          break;
      }
    });
  }

  return {
    storageAccount,
    connectionString,
  };
}
