const EventEmitter = require("events")
const eventEmitter = new EventEmitter();
const { easyResponse } = require("../utils/easyResponse");
const { addApp, getAppById, updateAppByAppId, updateAppById } = require("../models/app")
const { getAppInfo } = require("../models/appInfo")
const { decipherAlgorighm, decipherKey, graphQL_Endpoint } = require("../variables");
const { default: axios } = require("axios");

const getApp = async (event, context, callback) => {
    try {
        const appId = event.pathParameters.appId;
        const app = await getAppById(appId);
        if (app) {
            return easyResponse(app, 200, "App fetched successfully");
        } else {
            return easyResponse("", 404, "App not found");
        }
    } catch (error) {
        console.error(error);
        return easyResponse(error);
    }
}


// Create app for the Org
const createApp = async (event, context, callback) => {
    try {
        const requestData = JSON.parse(event.body);

        let decipher = crypto.createDecipheriv(
            decipherAlgorighm,
            decipherKey,
            requestData.iv
        );
        const decryptedData =
            decipher.update(requestData.encrypted, "hex", "utf-8") +
            decipher.final("utf-8");
        const {
            appId,
            appName,
            build,
            integrationId,
            appIntegrationId,
            appIntegrationSecret,
            accessToken
        } = JSON.parse(decryptedData);

        const appInfo = await getAppInfo();
        if (!appInfo) {
            return easyResponse({}, 400, "AppInfo Not Found");
        }
        const app = await getAppById(appId);
        if (app) {
            const updateData = await updateAppByAppId(appId, {
                clientName: appName,
                build,
                integrationId,
                appIntegrationId,
                appIntegrationSecret,
                token: accessToken
            });
            return easyResponse(updateData, 200, "App Created Succesfully");
        }

        const appData = await addApp({
            appId,
            clientName: appName,
            build,
            integrationId,
            appIntegrationId,
            appIntegrationSecret,
            token: accessToken,
        });

        eventEmitter.emit("run-initial-setup", { clientAppId: appId });
        return easyResponse(appData, 200, "App Created Succesfully");
    } catch (error) {
        console.error(error);
        return easyResponse(error);
    }
}

// GET all Org all datasource list
const getAllDatasourceList = async (event, context, callback) => {
    try {
        const appId = event.pathParameters.appId;
        // find the org app info    
        const findApp = await getAppById(appId)
        const graphQuery = `{
            apiViewer{
                app{
                  dataSources{
                    name
                    collectionName
                  }
                }
              }
        }`
        const buildQuery = {
            operationName: "fetchAllDatasourceList",
            query: `query fetchAllDatasourceList ${graphQuery}`,
            variables: {}
        }

        const token = findApp?.token;
        const datasourceList = await axios({
            url: graphQL_Endpoint,
            method: "post",
            data: buildQuery,
            headers: {
                "Content-Type": "application/json",
                Host: "open.api.woztell.com",
                Authorization: `Bearer ${token}`
            }
        })
        console.log("data source list", datasourceList);
        return easyResponse(datasourceList.data, 200, "DS list found")
    } catch (err) {
        console.error(err);
        return easyResponse(err);
    }
}



module.exports = {
    getApp,
    createApp,
    getAllDatasourceList
}
