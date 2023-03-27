## install
`npm i hc-axios-plus`

## what this?
- 为什么二次封装axios
    1. data structure is best simple
    2. error hint is best simple, it will close consoleLog in production
    3. loading: request to be true, response and error to be false
- config
    - baseURL：baseURL
    - TOKEN：请求头携带的，需要从localstory取出来的TOKEN的名字。
    - isShowErr:触发常用错误码返回对应信息。
    - isCancelRequest:A请求若在请求中，禁止A请求的重复请求。
- 默认配置
    - baseURL:'http://127.0.0.1:8080'
    - TOKEN:'TOKEN'
    - all other start with IS defult value is true

## example
`const {data,loading,status} = new Axios()`
