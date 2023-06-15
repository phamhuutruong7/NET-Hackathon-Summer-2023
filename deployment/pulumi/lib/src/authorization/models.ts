export enum RbacRoleDefinitions {
    StorageAccountContributor,
    StorageBlobDataOwner,
    StorageBlobDataContributor,
    StorageBlobDataReader,
    StorageTableDataContributor,
    StorageTableDataReader,
    StorageQueueDataMessageSender,
    StorageQueueDataMessageProcessor,
    StorageQueueDataContributor,
    KeyVaultSecretsUser,
    KeyVaultCryptoUser,
    KeyVaultCertificatesOfficer,
    KeyVaultSecretsOfficer,
    KeyVaultCryptoOfficer,
    AcrPull,
    // Note: There are more role definitions. If they are needed, they should be added here and added in the 'getRoleDefinitionId' function.
}