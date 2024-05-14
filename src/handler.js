
const { healthcheck, baseUrl } = require("./handlers/health")
const {getApp,createApp, getAllDatasourceList} = require("./handlers/app")

module.exports = {
    healthcheck,
    baseUrl,
    getApp,
    createApp,
    getAllDatasourceList
}