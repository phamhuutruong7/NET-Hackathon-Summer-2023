import * as keyvault from '@pulumi/azure-native/keyvault';
import * as models from './models';
import * as base from './../base';

// https://www.pulumi.com/docs/reference/pkg/azure-native/keyvault/
export function createKeyVault(input: models.CreateKeyVaultModel): keyvault.Vault {
    const serviceNamePascalCase = base.toPascalCase(input.serviceName);

    return new keyvault.Vault(`keyVault${serviceNamePascalCase}`, {
        resourceGroupName: input.resourceGroupName,
        vaultName: input.buildServiceName('kv'),
        properties: {
            enableRbacAuthorization: true,
            enablePurgeProtection: input.enablePurgeProtection,
            enableSoftDelete: true,
            softDeleteRetentionInDays: input.softDeleteRetentionInDays,
            sku: {
                family: keyvault.SkuFamily.A,
                name: keyvault.SkuName.Standard,
            },
            tenantId: input.tenantId,
        },

        tags: input.tags,
    });
}

export function createKeyVaultSecret(input: models.CreateSecretModel): keyvault.Secret {
    return new keyvault.Secret(input.pulumiResourceName, {
        vaultName: input.keyVaultName,
        resourceGroupName: input.resourceGroupName,
        secretName: input.secretName,
        properties: {
          value: input.secretValue,
        },
    
        tags: input.tags,
      });
}