import * as pulumi from '@pulumi/pulumi';
import * as resources from '@pulumi/azure-native/resources';
import * as authorization from '@pulumi/azure-native/authorization';

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

