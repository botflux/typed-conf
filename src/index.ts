// import { tc } from "typed-conf"
// import { env } from "typed-conf/source/envs"
// import { fs } from "typed-conf/source/fs"
// import { args } from "typed-conf/source/args"
// import { hashicorpVault } from "typed-conf/sources/hashicorp-vault"
//
// const vault = hashicorpVault({
//   url: "my-vault.com"
// })
//
// const envs=  env({ prefix: "APP_" })
// const a = args({})
//
// export const config = tc.config()
//   .schema({
//     vault: vault.config(),
//     configPath: tc.string(),
//     api: tc.object({
//       port: tc.port(),
//       host: tc.host().from(envs("API_HOST"))
//     }),
//     logs: tc.object({
//       level: tc.enum(["debug", "info", "warn", "error"]),
//       enable: tc.boolean()
//     }),
//     db: tc.object({
//       host: tc.host(),
//       port: tc.port(),
//       password: tc.secret().from(vault("db/password"))
//     })
//   })
//   .from([
//     a,
//     envs,
//     c => fs({ paths: [ c.config ?? "app.yml", "default.yml" ] })
//   ])
//   .secrets([ vault ])
//
