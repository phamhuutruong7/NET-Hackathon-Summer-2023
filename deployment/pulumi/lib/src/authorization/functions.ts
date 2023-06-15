import * as pulumi from '@pulumi/pulumi';
import * as authorization from '@pulumi/azure-native/authorization';
import * as models from './models';

export function addAcrPull(
    pulumiNamePrefix: string,
    subscriptionId: string,
    principalId: pulumi.Output<string>,
    scope: string | pulumi.Output<string> | pulumi.Input<string>,
    principalType: authorization.PrincipalType = authorization.PrincipalType.Group
) {
    // acr: assign 'Pull' role
    const acrPull = new authorization.RoleAssignment(`${pulumiNamePrefix}RoleAssignmentAcrPull`, {
        principalId,
        roleDefinitionId: getRoleDefinitionId(subscriptionId, models.RbacRoleDefinitions.AcrPull),
        scope,
        principalType,
    });
}

export function addKeyVaultUser(
    pulumiNamePrefix: string,
    subscriptionId: string,
    principalId: string | pulumi.Output<string>,
    scope: string | pulumi.Output<string>,
    principalType: authorization.PrincipalType = authorization.PrincipalType.Group
) {
    // keyvault: assign 'User' roles to web app
    const secretUser = new authorization.RoleAssignment(`${pulumiNamePrefix}RoleAssignmentSecretUser`, {
        principalId,
        roleDefinitionId: getRoleDefinitionId(subscriptionId, models.RbacRoleDefinitions.KeyVaultSecretsUser),
        scope,
        principalType,
    });

    const cryptoUser = new authorization.RoleAssignment(`${pulumiNamePrefix}RoleAssignmentCryptoUser`, {
        principalId,
        roleDefinitionId: getRoleDefinitionId(subscriptionId, models.RbacRoleDefinitions.KeyVaultCryptoUser),
        scope,
        principalType,
    });
}

export function addKeyVaultCertificateOfficer(
    pulumiNamePrefix: string,
    subscriptionId: string,
    principalId: string | pulumi.Output<string> | pulumi.Input<string>,
    scope: string | pulumi.Output<string>,
    principalType: authorization.PrincipalType = authorization.PrincipalType.Group
) {
    const certificateOfficer = new authorization.RoleAssignment(`${pulumiNamePrefix}RoleAssignmentCertificateOfficer`, {
        principalId,
        roleDefinitionId: getRoleDefinitionId(subscriptionId, models.RbacRoleDefinitions.KeyVaultCertificatesOfficer),
        scope,
        principalType,
    });
}

export function addKeyVaultOfficer(
    pulumiNamePrefix: string,
    subscriptionId: string,
    principalId: string | pulumi.Output<string> | pulumi.Input<string>,
    scope: string | pulumi.Output<string>,
    principalType: authorization.PrincipalType = authorization.PrincipalType.Group
) {
    // find role definition name via 'az role definition list --output table'
    // get id via: 'az role definition list --name "<name>"'

    // keyvault: assign 'Officer' roles to the team
    const secretOfficer = new authorization.RoleAssignment(`${pulumiNamePrefix}RoleAssignmentSecretOfficer`, {
        principalId,
        roleDefinitionId: getRoleDefinitionId(subscriptionId, models.RbacRoleDefinitions.KeyVaultSecretsOfficer),
        scope,
        principalType,
    });

    const cryptoOfficer = new authorization.RoleAssignment(`${pulumiNamePrefix}RoleAssignmentCryptoOfficer`, {
        principalId,
        roleDefinitionId: getRoleDefinitionId(subscriptionId, models.RbacRoleDefinitions.KeyVaultCryptoOfficer),
        scope,
        principalType,
    });

    addKeyVaultCertificateOfficer(pulumiNamePrefix, subscriptionId, principalId, scope, principalType);
}

// add BlobReader, TableReader, QueueProcessor roles
export function addStorageReader(
    pulumiNamePrefix: string,
    subscriptionId: string,
    principalId: string | pulumi.Output<string>,
    scope: string | pulumi.Output<string>,
    principalType: authorization.PrincipalType = authorization.PrincipalType.Group
  ) {
    // search for roles with powershell:
    // this JMES Path should work, but doesn't :(  az role definition list --query "[?contains(roleName,'Storage')].{Name:roleName,Id:id,Description:description}"
    // az role definition list --query "[].{Name:roleName,Id:id,Description:description}" -o json | ConvertFrom-Json | where Name -like "Storage*" | select Name, Id | sort Name | ft
  
    const storageBlobReader = new authorization.RoleAssignment(`${pulumiNamePrefix}RoleAssignmentBlobReader`, {
      principalId,
      roleDefinitionId: getRoleDefinitionId(subscriptionId, models.RbacRoleDefinitions.StorageBlobDataReader),
      scope,
      principalType,
    });
  
    const storageTableReader = new authorization.RoleAssignment(`${pulumiNamePrefix}RoleAssignmentTableReader`, {
      principalId,
      roleDefinitionId: getRoleDefinitionId(subscriptionId, models.RbacRoleDefinitions.StorageTableDataReader),
      scope,
      principalType,
    });
  
    const storageQueueProcessor = new authorization.RoleAssignment(`${pulumiNamePrefix}RoleAssignmentQueueProcessor`, {
      principalId,
      roleDefinitionId: getRoleDefinitionId(subscriptionId, models.RbacRoleDefinitions.StorageQueueDataMessageProcessor),
      scope,
      principalType,
    });
  }
  
  // add BlobContributor, TableContributor, QueueContributor roles
  export function addStorageContributor(
    pulumiNamePrefix: string,
    subscriptionId: string,
    principalId: string | pulumi.Output<string>,
    scope: string | pulumi.Output<string>,
    principalType: authorization.PrincipalType = authorization.PrincipalType.Group
  ) {
    // search for roles with powershell:
    // this JMES Path should work, but doesn't :(  az role definition list --query "[?contains(roleName,'Storage')].{Name:roleName,Id:id,Description:description}"
    // az role definition list --query "[].{Name:roleName,Id:id,Description:description}" -o json | ConvertFrom-Json | where Name -like "Storage*" | select Name, Id | sort Name | ft
  
    const storageBlobContributor = new authorization.RoleAssignment(`${pulumiNamePrefix}RoleAssignmentBlobContributor`, {
      principalId,
      roleDefinitionId: getRoleDefinitionId(subscriptionId, models.RbacRoleDefinitions.StorageBlobDataContributor),
      scope,
      principalType,
    });
  
    const storageTableContributor = new authorization.RoleAssignment(`${pulumiNamePrefix}RoleAssignmentTableContributor`, {
      principalId,
      roleDefinitionId: getRoleDefinitionId(subscriptionId, models.RbacRoleDefinitions.StorageTableDataContributor),
      scope,
      principalType,
    });
  
    const storageQueueContributor = new authorization.RoleAssignment(`${pulumiNamePrefix}RoleAssignmentQueueContributor`, {
      principalId,
      roleDefinitionId: getRoleDefinitionId(subscriptionId, models.RbacRoleDefinitions.StorageQueueDataContributor),
      scope,
      principalType,
    });
  }
  
  export function addStorageRbacForAppServices(
    pulumiNamePrefix: string,
    subscriptionId: string,
    principalId: string | pulumi.Output<string>,
    scope: string | pulumi.Output<string>,
    principalType: authorization.PrincipalType = authorization.PrincipalType.Group
  ) {
    // Needed for blob trigger.
    const storageAccountContributor = new authorization.RoleAssignment(`${pulumiNamePrefix}RoleAssignmentAccountContributor`, {
      principalId,
      roleDefinitionId: getRoleDefinitionId(subscriptionId, models.RbacRoleDefinitions.StorageAccountContributor),
      scope,
      principalType,
    });
  
    // Needed to connect function app to storage with an identity (https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference?tabs=queue#connecting-to-host-storage-with-an-identity-preview), for blob trigger, blob output binding.
    const storageBlobDataOwner = new authorization.RoleAssignment(`${pulumiNamePrefix}RoleAssignmentBlobDataOwner`, {
      principalId,
      roleDefinitionId: getRoleDefinitionId(subscriptionId, models.RbacRoleDefinitions.StorageBlobDataOwner),
      scope,
      principalType,
    });
  
    // Needed for table output binding, table input binding (Storage Table Data Reader is needed, but Storage Table Data Contributor accumulates the same permissions).
    const storageTableDataContributor = new authorization.RoleAssignment(`${pulumiNamePrefix}RoleAssignmentTableDataContributor`, {
      principalId,
      roleDefinitionId: getRoleDefinitionId(subscriptionId, models.RbacRoleDefinitions.StorageTableDataContributor),
      scope,
      principalType,
    });
  
    // Needed for blob trigger, queue output binding, queue trigger (Storage Queue Data Reader and Storage Queue Data Message Processor are needed, but Storage Queue Data Contributor accumulates the same permissions).
    const storageQueueDataContributor = new authorization.RoleAssignment(`${pulumiNamePrefix}RoleAssignmentQueueDataContributor`, {
      principalId,
      roleDefinitionId: getRoleDefinitionId(subscriptionId, models.RbacRoleDefinitions.StorageQueueDataContributor),
      scope,
      principalType,
    });
  
    // Needed for queue output binding.
    const storageQueueDataMessageSender = new authorization.RoleAssignment(`${pulumiNamePrefix}RoleAssignmentQueueDataMessageSender`, {
      principalId,
      roleDefinitionId: getRoleDefinitionId(subscriptionId, models.RbacRoleDefinitions.StorageQueueDataMessageSender),
      scope,
      principalType,
    });
  }

export function getRoleDefinitionId(subscriptionId: string, roleDefinition: models.RbacRoleDefinitions): string {
    let roleDefinitionGuid: string;
    switch (roleDefinition) {
        case models.RbacRoleDefinitions.StorageBlobDataReader:
            roleDefinitionGuid = '2a2b9908-6ea1-4ae2-8e65-a410df84e7d1';
            break;
        case models.RbacRoleDefinitions.StorageTableDataReader:
            roleDefinitionGuid = '76199698-9eea-4c19-bc75-cec21354c6b6';
            break;
        case models.RbacRoleDefinitions.StorageQueueDataMessageProcessor:
            roleDefinitionGuid = '8a0f0c08-91a1-4084-bc3d-661d67233fed';
            break;
        case models.RbacRoleDefinitions.StorageBlobDataContributor:
            roleDefinitionGuid = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe';
            break;
        case models.RbacRoleDefinitions.StorageTableDataContributor:
            roleDefinitionGuid = '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3';
            break;
        case models.RbacRoleDefinitions.StorageQueueDataContributor:
            roleDefinitionGuid = '974c5e8b-45b9-4653-ba55-5f855dd0fb88';
            break;
        case models.RbacRoleDefinitions.StorageBlobDataOwner:
            roleDefinitionGuid = 'b7e6dc6d-f1e8-4753-8033-0f276bb0955b';
            break;
        case models.RbacRoleDefinitions.StorageAccountContributor:
            roleDefinitionGuid = '17d1049b-9a84-46fb-8f53-869881c3d3ab';
            break;
        case models.RbacRoleDefinitions.StorageQueueDataMessageSender:
            roleDefinitionGuid = 'c6a89b2d-59bc-44d0-9896-0f6e12d7b80a';
            break;
        case models.RbacRoleDefinitions.KeyVaultSecretsUser:
            roleDefinitionGuid = '4633458b-17de-408a-b874-0445c86b69e6';
            break;
        case models.RbacRoleDefinitions.KeyVaultCryptoUser:
            roleDefinitionGuid = '12338af0-0e69-4776-bea7-57ae8d297424';
            break;
        case models.RbacRoleDefinitions.KeyVaultCertificatesOfficer:
            roleDefinitionGuid = 'a4417e6f-fecd-4de8-b567-7b0420556985';
            break;
        case models.RbacRoleDefinitions.KeyVaultSecretsOfficer:
            roleDefinitionGuid = 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7';
            break;
        case models.RbacRoleDefinitions.KeyVaultCryptoOfficer:
            roleDefinitionGuid = '14b46e9e-c2b7-41b4-b07b-48a6ebf60603';
            break;
        case models.RbacRoleDefinitions.AcrPull:
            roleDefinitionGuid = '7f951dda-4ed3-4680-a7ca-43fe172d538d';
            break;
        // Note: There are more role definitions. If they are needed, they should be added here and added in the 'models.RbacRoleDefinitions' enum definition.
        default:
            roleDefinitionGuid = '(Unknown)';
            break;
    }

    return `/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/${roleDefinitionGuid}`;
}

// convenient function to create a dictionary necessary for the userAssignedManagedIdentities-Property
export function buildUserAssignedIdentities(...ids: pulumi.Output<string>[]): { [key: string]: object } {
    return pulumi.all(ids).apply((unwrapped) => {
        const dict: { [key: string]: object } = {};

        unwrapped.forEach((id) => (dict[`${id}`] = {}));

        return dict;
    });
}