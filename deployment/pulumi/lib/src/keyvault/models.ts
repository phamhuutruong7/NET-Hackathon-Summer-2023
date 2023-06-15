import * as pulumi from '@pulumi/pulumi';
import { IBaseServiceModel, BaseServiceModel } from "../base";

interface ICreateKeyVaultModel extends IBaseServiceModel {
    enablePurgeProtection?: boolean | pulumi.Input<boolean>;
    softDeleteRetentionInDays?: number | pulumi.Input<number>;
}

export class CreateKeyVaultModel extends BaseServiceModel implements ICreateKeyVaultModel {
    public enablePurgeProtection?: boolean | pulumi.Input<boolean>;
    public softDeleteRetentionInDays?: number | pulumi.Input<number>;

    constructor();
    constructor(obj: ICreateKeyVaultModel);
    // eslint-disable-next-line
    constructor(obj?: any) {
        super(obj);

        this.enablePurgeProtection = obj.enablePurgeProtection || true;
        this.softDeleteRetentionInDays = obj.softDeleteRetentionInDays || 14;
    }
}

interface ICreateSecretModel extends IBaseServiceModel {
    keyVaultName: string | pulumi.Input<string> | pulumi.Output<string>;
    pulumiResourceName: string;
    secretName: string;
    secretValue: string | pulumi.Input<string> | pulumi.Output<string>;
}

export class CreateSecretModel extends BaseServiceModel implements ICreateSecretModel {
    public keyVaultName: string | pulumi.Input<string> | pulumi.Output<string>;
    public pulumiResourceName: string;
    public secretName: string;
    public secretValue: string | pulumi.Input<string> | pulumi.Output<string>;

    constructor();
    constructor(obj: ICreateSecretModel);
    // eslint-disable-next-line
    constructor(obj?: any) {
        super(obj);

        if (!obj.keyVaultName) {
            throw new Error('keyVaultName must be set.');
        }
        if (!obj.pulumiResourceName) {
            throw new Error('pulumiResourceName must be set.');
        }
        if (!obj.secretName) {
            throw new Error('secretName must be set.');
        }
        if (!obj.secretValue) {
            throw new Error('secretValue must be set.');
        }
        
        this.keyVaultName = obj.keyVaultName;
        this.pulumiResourceName = obj.pulumiResourceName;
        this.secretName = obj.secretName;
        this.secretValue = obj.secretValue;
    }
}