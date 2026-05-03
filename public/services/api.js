class Api {
    baseUrl
    constructor(baseUrl) {
        this.baseUrl = baseUrl
    }
    async post(endpoint, body) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        })
        return response
    }
    async get(endpoint) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        })
        return response
    }
    async put(endpoint, body) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        })
        return response
    }
    async patch(endpoint, body) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        })
        return response
    }
}

var PORTA_APP = process.env.APP_PORT;
var HOST_APP = process.env.APP_HOST;

const url = `http://${HOST_APP}:${PORTA_APP}`

const api = new Api(url)
