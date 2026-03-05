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

const url = "http://localhost:3333"

const api = new Api(url)
