// 1. data structure is best simple
// 2. error hint is best simple, it will close consoleLog in production
// 3. loading: request to be true, response and error to be false

import axios from "axios";
import PreventRepeat from "./preventRepeat";
let loading = false;
// 防止高频重复请求，如果请求没有返回还在请求，那么取消请求
const PreventRepeatInstance = new PreventRepeat();
const isDEV = process.env.NODE_ENV === "development";
const TOKEN_KEY = "TOKEN";

export default class useAxios {
  constructor(config) {
    const instance = this.axiosCreate(config);
    instance.interceptors.request.use(
      (config) => {
        // !== undefined 兼容SSR
        if (typeof window !== "undefined") {
          let getToken = localStorage.getItem(TOKEN_KEY);
          config.headers.authorization = getToken ? `Bearer ${getToken}` : null;
        }
        PreventRepeatInstance.removePending(config);
        PreventRepeatInstance.addPending(config);
        loading = true;
        return config;
      },
      (err) => {
        return Promise.reject(handleNetworkError(err) || err);
      }
    );

    instance.interceptors.response.use(
      (res) => {
        if (res.status !== 200) return Promise.reject(res.data);
        PreventRepeatInstance.removePending(res.config);
        // 处理授权错误
        // console.log("res", res);
        let { data, status, statusText } = res;
        return {
          data: res.data,
          loading: false,
          status,
          statusText,
          errorMsg: handleAuthError(res.data.error),
        };
      },
      (err) => {
        // if (isDEV) {
        //   console.log("err", err);
        // }
        if (err.code === "ERR_CANCELED") return Promise.reject("请求已取消");
        PreventRepeatInstance.removePending(err.config);
        handleNetworkError(err);
        console.log(
          "custormError: handleNetworkError(err)",
          handleNetworkError(err)
        );
        return Promise.reject({ ...err.response, loading: false });
      }
    );

    return instance;
  }

  get(url, params, config) {
    return this.instance.get(url, { params, ...config });
  }

  post(url, data, config) {
    return this.instance.post(url, data, config);
  }

  put(url, data, config) {
    return this.instance.put(url, data, config);
  }

  delete(url, params, config) {
    return this.instance.delete(url, { params, ...config });
  }

  axiosCreate(config) {
    return axios.create({
      timeout: 5000, //超时配置
      withCredentials: true, //跨域携带cookie
      baseURL: import.meta.env.VITE_BASE_URL, //挂载在process下的环境常量
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        // 'Content-Type': 'application/x-www-form-urlencoded',
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild",
        "Access-Control-Allow-Credentials": "true",
      },
      // run it when request interceptor perform，以普通表单形式(键值对)发送到后端，而不是json形式，对后端友好
      // 万一是自己全栈开放呢
      // transformRequest: [
      //     (data) => {
      //         let result = ''
      //         for (let key in data) {
      //             result += encodeURIComponent(key) + '=' + encodeURIComponent(data[key]) + '&'
      //         }
      //         return result.slice(0, result.length - 1)
      //     }
      // ],
      // ...config,   // 自定义配置覆盖基本配置
    });
  }
}

const handleAuthError = (error) => {
  const authErrMap = {
    10031: "登录失效，需要重新登录", // token 失效
    10032: "您太久没登录，请重新登录~", // token 过期
    10033: "账户未绑定角色，请联系管理员绑定角色",
    10034: "该用户未注册，请联系管理员注册用户",
    10035: "code 无法获取对应第三方平台用户",
    10036: "该账户未关联员工，请联系管理员做关联",
    10037: "账号已无效",
    10038: "账号未找到",
  };

  if (authErrMap.hasOwnProperty(error)) {
    // message.error(authErrMap[error]);
    // 授权错误，登出账户
    // logout();
    return authErrMap[error];
  }

  return null;
};

const handleNetworkError = (err) => {
  // let errStaus = err.response.status;
  if (axios.isCancel(err))
    return console.error("请求的重复请求：" + error.message);
  let errMessage = "未知错误";
  if (err && error.response) {
    switch (err.response.status) {
      case 400:
        errMessage = "错误的请求";
        break;
      case 401:
        errMessage = "未授权，请重新登录";
        break;
      case 403:
        errMessage = "拒绝访问";
        break;
      case 404:
        errMessage = "请求错误,未找到该资源";
        break;
      case 405:
        errMessage = "请求方法未允许";
        break;
      case 408:
        errMessage = "请求超时";
        break;
      case 500:
        errMessage = "服务器端出错";
        break;
      case 501:
        errMessage = "网络未实现";
        break;
      case 502:
        errMessage = "网络错误";
        break;
      case 503:
        errMessage = "服务不可用";
        break;
      case 504:
        errMessage = "网络超时";
        break;
      case 505:
        errMessage = "http版本不支持该请求";
        break;
      default:
        errMessage = `未知错误 --${errStatus}`;
    }
  } else {
    errMessage = `无法连接到服务器！`;
  }
  if (err.message.includes("timeout")) errMessage = "网络请求超时！";
  if (err.message.includes("Network"))
    errMessage = window.navigator.onLine ? "服务端异常！" : "您断网了！";
  return errMessage;
};
