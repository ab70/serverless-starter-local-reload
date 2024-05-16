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
        const data = {
            "_id": "663dff79c148fcc6e284ad4c",
            "Analytics Action": "",
            "Analytics Category": "",
            "Analytics Label": "",
            "Category 1": "Before Application",
            "Category 1 Priority": "1",
            "Category 2": "Programme Information",
            "Category 2 Priority": "2",
            "Category 3": "Programme Contact",
            "Category 3 Priority": "1",
            "Image URL": "",
            "Keyword Group 1": "\"HKCMCL\", \"DTSPP\"",
            "Keyword Group 2": "\"role\"",
            "Keyword Group 3": "",
            "Locale": "en",
            "Preview URL": "",
            "Question": "What is the role of Hong Kong Cyberport Management Company Limited of DTSPP?",
            "Question ID": "Q.0010",
            "Text": "Hong Kong Cyberport Management Company Limited (“HKCMCL”) is the administrator of the Programme.   For any queries about this Guide or the Programme, please contact HKCMCL through the channels listed in https://dtspp.cyberport.hk/contact.",
            "Type": "text",
            "compositeId": "",
            "etag": "d-j1t7ksJhCA/8OFAfgcyqdisUkHQ",
            "treeId": "",
            "Created At (+06:00)": "1/2/2024 8:52",
            "Updated At (+06:00)": "1/2/2024 8:52",
            "createdAt": 1715339129986,
            "updatedAt": 1715339129986,
            "id": "NjYxZjYzNTE1NmQ4M2Y5MmRmZDZlZGM4X2ZhcWRzOjY2M2RmZjc5YzE0OGZjYzZlMjg0YWQ0Yw=="
        }
        console.log("reqBody", reqBody?.data);
        const inputString = {
            action: "REPLACE",
            app: appId,
            clientMutationId: 8,
            collectionName: "661f635156d83f92dfd6edc8_faqds",
            data: reqBody?.data
        }
        console.log("InputString",inputString);
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
        console.log("errors",datasourceList?.data);
    } catch (err) {
        console.log(err.response.data);
    }
}



module.exports = {
    getApp,
    createApp,
    getAllDatasourceList,
    updateDS
}
