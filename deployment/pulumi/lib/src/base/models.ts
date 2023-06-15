import * as pulumi from '@pulumi/pulumi';

export interface Tags {
    [key: string]: pulumi.Input<string>;
}

interface IBaseModel {
    tags: Tags;
    tenantId: string;
    subscriptionId: string;
    namePrefix: string;
    env: string;
    servicePrincipalId: string;
}

export class BaseModel implements IBaseModel {
    public tags: Tags;
    public tenantId: string;
    public subscriptionId: string;
    public namePrefix: string;
    public env: string;
    public servicePrincipalId: string;

    constructor();
    constructor(obj: IBaseModel);
    // eslint-disable-next-line
    constructor(obj?: any) {
        if (!obj) {
            console.log('daj');
            console.log(arguments.callee.caller.toString());
            throw new Error('obj must be set.');
        }

        if (!obj.tenantId) {
            throw new Error('tenantId must be set.');
        }
        this.tenantId = obj.tenantId;

        if (!obj.subscriptionId) {
            throw new Error('subscriptionId must be set.');
        }
        this.subscriptionId = obj.subscriptionId;

        if (!obj.namePrefix) {
            throw new Error('namePrefix must be set.');
        }
        this.namePrefix = obj.namePrefix;

        if (!obj.servicePrincipalId) {
            throw new Error('servicePrincipalId must be set.');
        }
        this.servicePrincipalId = obj.servicePrincipalId;

        if (!obj.env) {
            throw new Error('env must be set.');
        }
        this.env = obj.env;

        this.tags = (obj && obj.tags) || {};
    }
}

export interface IBaseServiceModel extends IBaseModel {
    serviceName?: string;
    resourceGroupName: string | pulumi.Output<string>;
}

export class BaseServiceModel extends BaseModel implements IBaseServiceModel {
    public resourceGroupName: string | pulumi.Output<string>;
    public serviceName?: string;

    constructor();
    constructor(obj: IBaseModel);
    // eslint-disable-next-line
    constructor(obj?: any) {
        super(obj);

        if (!obj.resourceGroupName) {
            throw new Error('resourceGroupName must be set.');
        }
        this.resourceGroupName = obj.resourceGroupName;

        this.serviceName = obj.serviceName || '';
    }

    /**
     *
     * @param serviceType snake-case name of the service (short), e.g. sql: sql-server, e.g. key vault: kv
     * @returns builds together the resource name, if the service name variable is set it will include that
     */
    public buildServiceName(serviceType: string, cleaned: boolean = false): string {
        // TODO: make service type an enum and retrieve short versions of services from a list
        const serviceName = this.serviceName ? `-${this.serviceName}` : '';
        const result = `${this.namePrefix}-${serviceType}${serviceName}-${this.env}`;

        return cleaned === false ? result : result.replace(/-/g, '');
    }

    public getBaseModel(): BaseServiceModel {
        return this;
    }
}