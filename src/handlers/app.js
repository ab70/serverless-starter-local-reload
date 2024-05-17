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
        // const appId = "661f635156d83f92dfd6edc8"
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
        // 
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
        return easyResponse(datasourceList.data, 200, "DS list found")
    } catch (err) {
        console.error(err);
        return easyResponse(err);
    }
}

// UPDATE DATAsource
const updateDS = async (event, context, callback) => {
    try {
        const appId = event.pathParameters.appId;
        const reqBody = JSON.parse(event.body)

        const inputString = {
            action: reqBody?.action || "REPLACE",
            app: appId,
            clientMutationId: 8,
            collectionName: reqBody?.collectionName,
            data: reqBody?.data
        }
        console.log("InputString", inputString);
        const buildQuery = {
            operationName: "import",
            query: `mutation import($input : ImportDataSourceInput!){
                importDataSource(input: $input){
                    clientMutationId
                    data
                }
              }
            `,
            variables: {
                input: inputString
            }
        }
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJBUEkiLCJhcHAiOiI2NjFmNjM1MTU2ZDgzZjkyZGZkNmVkYzgiLCJhY2wiOlsiYXBpOmFkbWluIl0sImp0aSI6ImMzNTk2NGNlLWNhY2QtNTFiOC1hNmUxLTk4M2IwYzU4MzhkYSIsImlzcyI6IjY2MWY2MmYwNTZkODNmMTIzN2Q2ZWRjMyIsImlhdCI6MTcxNTU3NzQ4MDY2OSwibWV0YSI6eyJpbnRlZ3JhdGlvbklkIjoiRkFRX2RhdGFzb3VyY2VfY2hlY2tlciIsImJ1aWxkIjoxLCJhcHBJbnRlZ3JhdGlvbiI6IjY2NDFhMjg4YzE0OGZjMzYxYTg0YzFjOCJ9fQ.93c2aZkqs7eu_K7JHOjqg8uGEw4jldsII92FvZOaPds"
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
        return easyResponse({}, 200, "Datasource updated")
    } catch (err) {
        console.log(err.response.data);
        return easyResponse({}, 400, "Datasource failed to updated")
    }
}



module.exports = {
    getApp,
    createApp,
    getAllDatasourceList,
    updateDS
}
