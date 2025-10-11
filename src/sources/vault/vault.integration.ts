import {after, before, describe, it, test} from "node:test";
import {expect} from "expect";
import {c} from "../../loader.js";
import {vaultConfig, vaultDynamicSecret, vaultSource} from "./vault.js";
import vault from "node-vault";
import {envSource} from "../envs.js";
import assert from "node:assert/strict";
import {Network, StartedNetwork} from "testcontainers";
import {StartedVaultContainer, VaultContainer} from "@testcontainers/vault";
import {MongoDBContainer, StartedMongoDBContainer} from "@testcontainers/mongodb";
import {FakeClock} from "../../clock/fake-clock.js";

describe('vault', function () {
  let network!: StartedNetwork
  let vaultContainer!: StartedVaultContainer
  let mongodbContainer!: StartedMongoDBContainer
  const token = "token"

  before(async () => {
    const mongodbUsername = "test"
    const mongodbPassword = "testpass"
    const mongodbNetworkAlias = "mongodb"

    const vaultMongoConfigName = "my-mongodb-database"
    const vaultMongoRole = "my-role"

    network = await new Network().start()
    mongodbContainer = await new MongoDBContainer("mongo:8")
      .withUsername(mongodbUsername)
      .withPassword(mongodbPassword)
      .withNetwork(network)
      .withNetworkAliases(mongodbNetworkAlias)
      .start()
    vaultContainer = await new VaultContainer("hashicorp/vault:1.20")
      .withVaultToken(token)
      .withNetwork(network)
      .withInitCommands(
        "secrets enable database",
        vaultConfigureMongoPluginCommand(vaultMongoConfigName, vaultMongoRole, mongodbNetworkAlias, mongodbUsername, mongodbPassword),
        vaultCreateRoleCommand(vaultMongoConfigName, vaultMongoRole)
      )
      .start()
  })

  after(async () => {
    await vaultContainer.stop()
    await mongodbContainer.stop()
    await network.stop()
  })

  it('should be able to not load anything by default', async function () {
    // Given
    const source = vaultSource()
    const schema = c.object({
      password: c.string().secret().optional()
    })

    // When
    const config = await source.load(schema.schema, {}, {})

    // Then
    expect(config).toEqual({})
  })


  it("should be able to interpolate secret", async (t) => {
    // Given
    const client = vault({
      apiVersion: "v1",
      token: vaultContainer.getRootToken()!,
      endpoint: vaultContainer.getAddress()
    })

    await client.write("secret/data/my-secret", {
      data: {
        foo: "bar"
      }
    })

    const fn = vaultSource().getEvaluatorFunction?.({
      vault: {
        endpoint: vaultContainer.getAddress(),
        token
      }
    }, {})

    // When
    const result = await fn?.fn({ path: "secret/data/my-secret", key: 'foo' })

    // Then
    expect(result).toEqual('bar')
  })

  it("should be able to load dynamic secrets", async (t) => {
    // Given
    const clock = new FakeClock(Date.now())
    const fn = vaultSource().getEvaluatorFunction?.({
      vault: {
        endpoint: vaultContainer.getAddress(),
        token
      }
    }, { clock })

    // When
    const result = await fn?.fn({
      path: "database/creds/my-role",
    })

    // Then
    expect(result).toMatchObject({
      expiresAt: new Date(clock.now() + 3600).getTime(),
      lease_duration: 3600,
      lease_id: expect.any(String),
      data: {
        username: expect.any(String),
        password: expect.any(String)
      },
      renewable: true,
      request_id: expect.any(String)
    })
  })
})

function vaultConfigureMongoPluginCommand(
  configName: string,
  allowedRole: string,
  mongodbAlias: string,
  mongodbUsername: string,
  mongodbPassword: string
) {
  return `write database/config/${configName} plugin_name=mongodb-database-plugin allowed_roles="${allowedRole}" connection_url="mongodb://{{username}}:{{password}}@${mongodbAlias}:27017/admin?tls=false" username="${mongodbUsername}" password="${mongodbPassword}"`
}

function vaultCreateRoleCommand(configName: string, role: string) {
  /*vault write database/roles/my-role \
    db_name=my-mongodb-database \
    creation_statements='{ "db": "admin", "roles": [{ "role": "readWrite" }, {"role": "read", "db": "foo"}] }' \
    default_ttl="1h" \
    max_ttl="24h"*/

  return `write database/roles/my-role db_name=my-mongodb-database creation_statements='{ "db": "admin", "roles": [{ "role": "readWrite" }, {"role": "read", "db": "foo"}] }' default_ttl="1h" max_ttl="24h"`
}
