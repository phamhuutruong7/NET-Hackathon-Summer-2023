import * as containerregistry from '@pulumi/azure-native/containerregistry';
import * as models from './models';

export function createContainerRegistry(config: models.AcrConfig, input: models.CreateContainerRegistryModel): containerregistry.Registry {
    return new containerregistry.Registry('acr', {
        registryName: input.registryName,
        resourceGroupName: input.resourceGroupName,
        adminUserEnabled: input.adminUserEnabled,
        sku: {
            name: config.skuName
        },
        tags: input.tags,
    });
}

