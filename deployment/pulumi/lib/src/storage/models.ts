import * as pulumi from '@pulumi/pulumi';
import * as storage from '@pulumi/azure-native/storage';
import { IBaseServiceModel, BaseServiceModel } from '../base';

export interface StorageAccountPlanConfig {
  sku: string;
  kind: string;
  containerDeleteRetentionPolicyDays?: number;
  deleteRetentionPolicyDays?: number;
  restorePolicyDays?: number;
}

export interface ICreateStorageAccountModel extends IBaseServiceModel {
  pulumiName?: string;
  accountName: string;
  minimumTlsVersion?: string;
  allowBlobPublicAccess?: boolean;
  enableHttpsTrafficOnly?: boolean;
  components?: StorageComponent[];
}

export class CreateStorageAccountModel extends BaseServiceModel implements ICreateStorageAccountModel {
  public pulumiName?: string;
  public accountName: string;
  public minimumTlsVersion?: string;
  public allowBlobPublicAccess?: boolean;
  public enableHttpsTrafficOnly?: boolean;
  public components?: StorageComponent[];

  constructor();
  constructor(obj: ICreateStorageAccountModel);
  constructor(obj?: any) {
    super(obj);

    if (!obj.accountName) {
      throw new Error('accountName must be set.');
    }
    this.accountName = obj.accountName;
    this.pulumiName = obj.pulumiName || 'saDefault';
    this.minimumTlsVersion = obj.minimumTlsVersion || 'TLS1_2';
    this.allowBlobPublicAccess = obj.allowBlobPublicAccess || false;
    this.enableHttpsTrafficOnly = obj.enableHttpsTrafficOnly || true;
    this.components = obj.components || [];
  }
}

export class StorageComponent {
  public componentType?: StorageComponentType;
  public pulumiName?: string;
  public resourceName?: string;

  constructor();
  constructor(obj: StorageComponent);
  constructor(obj?: any) {
    if (obj == null) return;

    if (!obj.componentType) {
      throw new Error('componentType must be set.');
    }
    if (!obj.pulumiName) {
      throw new Error('pulumiName must be set.');
    }
    if (!obj.resourceName) {
      throw new Error('resourceName must be set.');
    }

    this.componentType = obj.componentType;
    this.pulumiName = obj.pulumiName;
    this.resourceName = obj.resourceName;
  }
}

export class BlobStorageComponent extends StorageComponent {
  public accessType?: BlobStorageComponentAccessType;
  public denyEncryptionScopeOverride?: boolean;
  public defaultEncryptionScope?: string;

  constructor();
  constructor(obj: BlobStorageComponent);
  constructor(obj?: any) {
    super(obj);

    this.componentType = StorageComponentType.Blob; // too late, but can't be set earlier :(
    this.accessType = obj.accessType || BlobStorageComponentAccessType.None;
    this.defaultEncryptionScope = obj.defaultEncryptionScope || false;
    this.denyEncryptionScopeOverride = obj.denyEncryptionScopeOverride || '$account-encryption-key';
  }
}

export enum BlobStorageComponentAccessType {
  None = 'None',
  Blob = 'Blob',
  Container = 'Container',
}

export enum StorageComponentType {
  Blob = 'Blob',
  Queue = 'Queue',
  Table = 'Table',
}

export interface ICreateStorageAccountResult {
  storageAccount: storage.StorageAccount;
  connectionString: pulumi.Output<string>;
}
