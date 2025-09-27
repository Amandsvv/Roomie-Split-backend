class ApiResponse {
    constructor(statusCode, data, message = "Success"){
        this.sucess = statusCode < 400;
        this.statusCode = statusCode
        this.data= data
        this.message = message
    }
}

export { ApiResponse };