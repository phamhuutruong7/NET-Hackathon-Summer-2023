import * as pulumi from '@pulumi/pulumi';
import * as sql from '@pulumi/azure-native/sql';
import * as random from '@pulumi/random';
import * as models from './models';
import * as base from './../base'

export function createSqlServer(dbConfig: models.SqlDbDtuConfig, input: models.CreateSqlServerModel): models.ICreateSqlServerResult {
    //db username and password
    let dbAdmin = {
      username: new random.RandomString('sqlAdminUsername', {
        length: 8,
        special: false,
      }).result,
  
      password: new random.RandomPassword('sqlAdminPassword', {
        length: 32,
        special: true,
      }).result,
    };
  
    // https://www.pulumi.com/docs/reference/pkg/azure-native/sql/server/
    const sqlServer = new sql.Server('sqlServer', {
      resourceGroupName: input.resourceGroupName,
      serverName: input.buildServiceName("sql-server"),
      version: input.version,
      minimalTlsVersion: input.minimalTlsVersion,
      administratorLogin: dbAdmin.username,
      administratorLoginPassword: dbAdmin.password,
      administrators: {
        azureADOnlyAuthentication: true,
        administratorType: sql.AdministratorType.ActiveDirectory,
        principalType: sql.PrincipalType.Group,
        login: input.adminLoginName,
        sid: input.adminLoginSID,
        tenantId: input.tenantId,
      },
      identity: {
        type: sql.IdentityType.SystemAssigned,
      },
  
      tags: input.tags,
    });
  
    // add default firewall rule to enable Azure Service to access SQL Server
    addFirewallRuleAzureInternal(input.resourceGroupName, sqlServer.name);
  
    // check for appsfactory changes here: https://appsfactory.atlassian.net/wiki/spaces/ADMIN/pages/1716257207/Network+Documentation
  
    // add firewall rule for appsfactory office LEJ I
    addFirewallRule('sqlFirewallRuleAppsfactoryLej1', 'Appsfactory-LEJ1', input.resourceGroupName, sqlServer.name, '213.187.82.10');
  
    // add firewall rule for appsfactory office MUC I
    addFirewallRule('sqlFirewallRuleAppsfactoryMuc1', 'Appsfactory-MUC1', input.resourceGroupName, sqlServer.name, '80.81.30.42');
  
    // add firewall rule for appsfactory office CGN I
    addFirewallRule('sqlFirewallRuleAppsfactoryCgn1', 'Appsfactory-CGN1', input.resourceGroupName, sqlServer.name, '84.44.161.137');
  
    // add firewall rule for appsfactory office ERF I
    // no static IP yet
    //addFirewallRule("Appsfactory-ERF1", input.resourceGroupName, sqlServer.name, "")
  
    // add firewall rule for appsfactory office HAM I
    addFirewallRule('sqlFirewallRuleAppsfactoryHam1', 'Appsfactory-HAM1', input.resourceGroupName, sqlServer.name, '88.130.232.109');
  
    // state: 15.10.2021 - ERFI, MUCII have no static external IP currently!
    // that means for something like SQL Server you have to adjust your firewall settings from time to time
    // if you have chaging config like that we recommend doing it in the portal
  
    // add simple DTU based database
    const defaultDb = addDtuDatabase(input.databaseName, dbConfig, input.resourceGroupName, sqlServer.name, input.tags);
  
    const connectionString = pulumi.interpolate`Server=tcp:${sqlServer.fullyQualifiedDomainName},1433;Database=${defaultDb.name};`;
  
    return {
      dbAdmin,
      sqlServer,
      connectionString,
    };
  }
  
  export function addFirewallRuleAzureInternal(
    resourceGroupName: string | pulumi.Output<string>,
    sqlServerName: string | pulumi.Output<string>
  ): sql.FirewallRule {
    return addFirewallRule('sqlFirewallRuleAzureInternal', 'AzureInternal', resourceGroupName, sqlServerName, '0.0.0.0');
  }
  
  // https://www.pulumi.com/docs/reference/pkg/azure-native/sql/firewallrule/
  export function addFirewallRule(
    pulumiName: string,
    firewallRuleName: string,
    resourceGroupName: string | pulumi.Output<string>,
    sqlServerName: string | pulumi.Output<string>,
    startIpAddress: string,
    endIpAddress: string | null = null
  ): sql.FirewallRule {
    return new sql.FirewallRule(pulumiName, {
      resourceGroupName: resourceGroupName,
      serverName: sqlServerName,
      firewallRuleName: firewallRuleName,
      startIpAddress: startIpAddress,
      endIpAddress: endIpAddress || startIpAddress,
    });
  }
  
  // add a DTU based database
  // elastic / vCore based coming later
  // https://www.pulumi.com/docs/reference/pkg/azure-native/sql/database/
  export function addDtuDatabase(
    databaseName: string,
    dbDtuConfig: models.SqlDbDtuConfig,
    resourceGroupName: string | pulumi.Output<string>,
    sqlServerName: string | pulumi.Output<string>,
    tags: base.Tags
  ): sql.Database {
    return new sql.Database('defaultDb', {
      resourceGroupName,
      serverName: sqlServerName,
      databaseName: 'default',
      maxSizeBytes: dbDtuConfig.size,
      sku: {
        name: dbDtuConfig.tier,
        tier: dbDtuConfig.tier,
        capacity: dbDtuConfig.capacity,
      },
      requestedBackupStorageRedundancy: 'Local',
      tags,
    });
  }