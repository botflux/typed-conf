// import { tc } from "typed-conf"
// import { envSource } from "typed-conf/sources/envs"
// import { hashicorp } from "typed-conf/sources/hashicorp"
// import { tcFileSystem } from "typed-conf/sources/fs"
//
// const envs = envSource({ prefix: "APP_" })
//
// export const config = tc
//   .config({
//     db: tc.object({
//       host: tc.string().default("localhost"),
//       port: tc.port(),
//       password: tc.secret()
//     })
//   })
//   .from([ envs ])
//
// const envs1 = envSource({ prefix: "APP_", loadSecrets: false })
// const vault = hashicorp({ prefix: "app" })
//
// const fs = tcFileSystem({ paths: [ "app.yml", "default.yml" ] })
//
// export const config1 = tc
//   .config({
//     db: tc.object({
//       host: tc.string(),
//       port: tc.port(),
//       password: tc.secret({ defaultValue: vault("db.password") })
//     }),
//     hashicorp: vault.config()
//   })
//   .from([
//     vault.source(),
//     envs1,
//   ])
//
// const c = await config1.load({
//   envs: { APP_HOST: "localhost", APP_PORT: "3000" },
// })
