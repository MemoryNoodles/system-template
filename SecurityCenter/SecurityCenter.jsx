import React from "react";
import { Row, Col, Steps, Form, Input, Icon, Button, message } from "antd";
import Api from "~/until/api";
import { ContainerQuery } from 'react-container-query';
import { QUERY } from "~/constants/const";
import "./securityCenter.less";

const FormItem = Form.Item;
class Security extends React.Component {
    constructor() {
        super();
        this.state = {
            stepCurrent: 0,
            imgSrc: "",
            confirmDirty: false,
            issend: true,
            seconds: 60,
            tipTxt: "点击获取验证码",
            isclo: false,
            registWay: "",
            loginName: "",
            loginAllocation: {},
            moreVisible: false,
            tel: "",
            email: "",
            telOrEmail: "email",
            usercode: "",
            turnNum: 5,
            curScreen: ""
        };
        this.registType = "";
    }
    componentDidMount() {
        Api.AcquireAllocation({}).then(res => {
            console.log(res);
            const registWay = res.content.pwdBackWay;
            let registWayArray = registWay.split("_");
            if (registWayArray.indexOf("account") >= 0) {
                this.registType = "用户名";
            }
            if (registWayArray.indexOf("phone") >= 0) {
                this.registType =
                    this.registType +
                    (this.registType ? "/电话号码" : "电话号码");
            }
            if (registWayArray.indexOf("email") >= 0) {
                this.registType =
                    this.registType + (this.registType ? "/邮箱" : "邮箱");
            }
            this.setState({
                registWay: res.content.pwdBackWay,
                loginAllocation: res.content
            });
        });

        this.getLoginCaptcha();
    }
    static getDerivedStateFromProps = (props, prevState) => {
        const { curScreen } = props;

        if (curScreen !== prevState.curScreen) {
            return {
                curScreen
            };
        }
    };
    getLoginCaptcha = () => {
        Api.getLoginCaptcha().then(blob => {
            let url = URL.createObjectURL(blob);
            this.setState({
                imgSrc: url
            });
        });
    };
    userNameSubmit = e => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                Api.queryLoginName(values)
                    .then(res => {
                        this.setState({
                            stepCurrent: 1,
                            tel: res.content.phone,
                            email: res.content.email,
                            loginName: res.content.loginName,
                            usercode: values.loginName
                        });
                    })
                    .catch(res => {
                        this.getLoginCaptcha();

                        message.error(res.message);
                    });
            } else {
            }
        });
    };
    getTelCaptcha(e) {
        e.preventDefault();
        const _this = this;

        Api.sendRandomCaptcha({
            loginName: this.state.loginName,
            type: 3,
            backType: this.state.telOrEmail === "tel" ? 1 : 2
        }).then(res => {
            message.success(res.message);
            // 发送验证码成功
            // 显示60s倒计时
            const timer = setInterval(() => {
                _this.setState(
                    preState => {
                        return {
                            seconds: preState.seconds - 1,
                            tipTxt: `${_this.state.seconds}s后可重新发送`
                        };
                    },
                    () => {
                        if (
                            _this.state.seconds < 0 ||
                            this.state.isclo === true
                        ) {
                            clearInterval(timer);
                            _this.setState({
                                seconds: 60,
                                tipTxt: "点击获取验证码"
                            });
                        }
                    }
                );
            }, 1000);
        });
    }
    validateToNextPassword = (rule, value, callback) => {
        let loginRegistWay = this.state.loginAllocation;
        const form = this.props.form;
        let passwordRules = new RegExp(loginRegistWay.passwordRules);
        let message = loginRegistWay.codeRules;
        if (!passwordRules.test(value)) {
            callback(message);
        } else if (value && this.state.confirmDirty) {
            form.validateFields(["confirm"], { force: true });
            callback();
        }
    };
    //确认密码输入
    handleConfirmBlur = e => {
        const value = e.target.value;
        this.setState({ confirmDirty: this.state.confirmDirty || !!value });
    };
    compareToFirstPassword = (rule, value, callback) => {
        const form = this.props.form;

        if (value && value !== form.getFieldValue("newPwd")) {
            callback("两次密码不一致!");
        } else if (!value) {
            callback("请再次输入新密码");
        } else {
            callback();
        }
    };
    randomPwdSubmit = e => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                Api.modifyPassword1({
                    ...values,
                    step: 1,
                    backType: this.state.telOrEmail === "tel" ? 1 : 2,
                    usercode: this.state.usercode
                })
                    .then(res => {
                        this.setState({
                            stepCurrent: 2
                        });
                    })
                    .catch(res => {
                        message.error(res.message);
                    });
            } else {
            }
        });
    };
    userPwdSubmit = e => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                Api.modifyPassword1({
                    ...values,
                    step: 2,
                    usercode: this.state.usercode
                })
                    .then(res => {
                        this.setState({
                            stepCurrent: 3
                        });
                        let time = setInterval(() => {
                            this.setState({
                                turnNum: this.state.turnNum - 1
                            });
                            if (this.state.turnNum <= 0) {
                                clearInterval(time);
                                this.props.history.push("/Login");
                            }
                        }, 1000);
                    })
                    .catch(res => {
                        message.error(res.message);
                    });
            } else {
            }
        });
    };
    render() {
        const { getFieldDecorator } = this.props.form;
        const { curScreen } = this.state;
        const formItemLayout =
            curScreen === "mobile"
                ? {
                      labelCol: { span: 24 },
                      wrapperCol: { span: 24 }
                  } 
                : {
                      labelCol: { span: 4 },
                      wrapperCol: { span: 18 }
                  };
        return (
            <Row className="login-security-center">
                <div className="title">
                    <Row
                        style={{
                            width: "80%",
                            margin: "0 auto",
                            color: "#fff"
                        }}
                        type="flex"
                        justify="space-between"
                        align="middle"
                    >
                        <div>
                            <span style={{ fontSize: 15, marginRight: 10 }}>
                                安全中心
                            </span>
                            <span style={{ fontSize: 15, marginRight: 10 }}>
                                |
                            </span>
                            <span style={{ fontSize: 12 }}>重置密码</span>
                        </div>
                        <div
                            style={{ cursor: "pointer" }}
                            onClick={() => this.props.history.push("/Login")}
                        >
                            登录
                        </div>
                    </Row>
                </div>
                <Row
                    className="security-step"
                    style={{
                        height: 100,
                        background: "#f3fbfe",
                        paddingTop: 20
                    }}
                    type="flex"
                    justify="center"
                >
                    <div style={{ width: curScreen === "mobile" ? "" : "60%" }}>
                        <Steps
                            current={this.state.stepCurrent}
                            labelPlacement="vertical"
                            initial={
                                curScreen === "mobile"
                                    ? this.state.stepCurrent === 0
                                        ? 0
                                        : this.state.stepCurrent === 1
                                        ? 1
                                        : this.state.stepCurrent === 2
                                        ? 2
                                        : this.state.stepCurrent === 3
                                        ? 3
                                        : 0
                                    : 0
                            }
                        >
                            {curScreen === "mobile" &&
                            this.state.stepCurrent !== 0 ? (
                                ""
                            ) : (
                                <Steps.Step
                                    status={
                                        curScreen === "mobile" ? "process" : ""
                                    }
                                    description="填写账号"
                                />
                            )}
                            {curScreen === "mobile" &&
                            this.state.stepCurrent !== 1 ? (
                                ""
                            ) : (
                                <Steps.Step
                                    status={
                                        curScreen === "mobile" ? "process" : ""
                                    }
                                    description="身份验证"
                                />
                            )}
                            {curScreen === "mobile" &&
                            this.state.stepCurrent !== 2 ? (
                                ""
                            ) : (
                                <Steps.Step
                                    status={
                                        curScreen === "mobile" ? "process" : ""
                                    }
                                    description="设置新密码"
                                />
                            )}
                            {curScreen === "mobile" &&
                            this.state.stepCurrent !== 3 ? (
                                ""
                            ) : (
                                <Steps.Step
                                    status={
                                        curScreen === "mobile" ? "process" : ""
                                    }
                                    description="完成"
                                />
                            )}
                        </Steps>
                    </div>
                </Row>
                <div 
                    style={{
                        width: curScreen === "mobile" ? "90%" : "60%",
                        margin: "20px auto"
                    }}
                >
                    <div className="security-title">
                        找回密码
                        <span
                            style={{
                                color: "#999",
                                fontSize: 13,
                                marginLeft: 10,
                                fontWeight: "normal"
                            }}
                        >
                            我们不会向第三方泄露您的信息
                        </span>
                    </div>

                    {this.state.stepCurrent === 0 ? (
                        <div
                            className={
                                curScreen === "mobile"
                                    ? "mobile-center-box"
                                    : "center-box"
                            }
                        >
                            <Form
                                onSubmit={this.userNameSubmit}
                                className="login-form"
                            >
                                <FormItem label="用户名" {...formItemLayout}>
                                    {getFieldDecorator("loginName", {
                                        rules: [
                                            {
                                                required: true,
                                                message: "请输入用户名"
                                            }
                                        ]
                                    })(
                                        <Input
                                            prefix={
                                                <Icon
                                                    type="user"
                                                    style={{
                                                        color: "rgba(0,0,0,.25)"
                                                    }}
                                                />
                                            }
                                            placeholder={`请输入用户名`}
                                        />
                                    )}
                                </FormItem>
                                {this.state.loginAllocation.captcha ===
                                "yes" ? (
                                    <FormItem
                                        label="验证码"
                                        {...formItemLayout}
                                    >
                                        <Row
                                            type="flex"
                                            justify="space-between"
                                            align="middle"
                                        >
                                            <div
                                                className="kaptchald-div-input"
                                                style={{ flex: 1 }}
                                            >
                                                {getFieldDecorator("captcha", {
                                                    rules: [
                                                        {
                                                            required: true,
                                                            message:
                                                                "请输入验证码"
                                                        }
                                                    ]
                                                })(
                                                    <Input
                                                        placeholder="点击图片可刷新验证码"
                                                        prefix={
                                                            <Icon
                                                                type="safety-certificate"
                                                                style={{
                                                                    color:
                                                                        "rgba(0,0,0,.25)",
                                                                    fontSize: 16
                                                                }}
                                                            />
                                                        }
                                                    />
                                                )}
                                            </div>
                                            <img
                                                style={{
                                                    cursor: "pointer",
                                                    height: 34,
                                                    position: "relative",
                                                    top: 2,
                                                    marginLeft: 3
                                                }}
                                                title="看不清？点击更换"
                                                src={this.state.imgSrc}
                                                onClick={() =>
                                                    this.getLoginCaptcha()
                                                }
                                                alt=""
                                            />
                                        </Row>
                                    </FormItem>
                                ) : (
                                    ""
                                )}
                                <FormItem>
                                    <Row
                                        type="flex"
                                        justify={curScreen === "mobile" ? "center" : ""}
                                    >
                                        <Col offset={curScreen === "mobile" ? 0 : 4}>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                className="login-form-button"
                                            >
                                                确认
                                            </Button>
                                        </Col>
                                    </Row>
                                </FormItem>
                            </Form>
                        </div>
                    ) : (
                        ""
                    )}
                    {this.state.stepCurrent === 1 ? (
                        this.state.tel || this.state.email ? (
                            <div
                                className={
                                    curScreen === "mobile"
                                        ? "mobile-center-box"
                                        : "center-box"
                                }
                            >
                                <Form
                                    onSubmit={this.randomPwdSubmit}
                                    className="login-form"
                                >
                                    {this.state.tel &&
                                    this.state.telOrEmail === "tel" &&
                                    this.state.loginAllocation.openSms ? (
                                        <div style={{ marginBottom: 20 }}>
                                            我们将向您绑定的手机{this.state.tel}
                                            发送验证码：
                                        </div>
                                    ) : (
                                        ""
                                    )}
                                    {this.state.email &&
                                    this.state.telOrEmail === "email" ? (
                                        <div style={{ marginBottom: 20 }}>
                                            我们将向您绑定的邮箱
                                            {this.state.email}发送验证码：
                                        </div>
                                    ) : (
                                        ""
                                    )}

                                    <FormItem>
                                        <Row
                                            className="flex-cap-id"
                                            type="flex"
                                            align="middle"
                                        >
                                            <div
                                                style={{
                                                    width: "60%",
                                                    marginRight: 10,
                                                    flex: 1
                                                }}
                                            >
                                                {getFieldDecorator(
                                                    "randomPassword",
                                                    {
                                                        rules: [
                                                            {
                                                                required: true,
                                                                message:
                                                                    "输入验证码"
                                                            }
                                                        ]
                                                    }
                                                )(
                                                    <Input
                                                        placeholder="请输入验证码"
                                                        prefix={
                                                            <Icon
                                                                type="mail"
                                                                style={{
                                                                    color:
                                                                        "rgba(0,0,0,.25)"
                                                                }}
                                                            />
                                                        }
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                {this.state.seconds == 60 ? (
                                                    <Button
                                                        onClick={e =>
                                                            this.getTelCaptcha(
                                                                e
                                                            )
                                                        }
                                                    >
                                                        点击获取验证码
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        style={{
                                                            height: "40px",
                                                            // background: "#484988",
                                                            // border: "1px solid #484988",
                                                            color: "#9f9ea7"
                                                        }}
                                                    >
                                                        {this.state.tipTxt}
                                                    </Button>
                                                )}
                                            </div>
                                        </Row>
                                    </FormItem>
                                    <FormItem>
                                        <Row
                                            type="flex"
                                            justify={curScreen === "mobile" ? "center" : ""}
                                        >
                                            <Col offset={curScreen === "mobile" ? 0 : 4}>
                                                <Button
                                                    type="primary"
                                                    htmlType="submit"
                                                    className="login-form-button"
                                                >
                                                    确认
                                                </Button>
                                            </Col>
                                        </Row>
                                    </FormItem>
                                    <div>
                                        记不清了？
                                        <a
                                            href="javascript:;"
                                            onClick={() =>
                                                this.setState({
                                                    moreVisible: true
                                                })
                                            }
                                        >
                                            更换其他方式
                                        </a>
                                    </div>
                                </Form>
                            </div>
                        ) : (
                            <div
                                className={
                                    curScreen === "mobile"
                                        ? "mobile-center-box"
                                        : "center-box"
                                }
                            >
                                您没有绑定手机或邮箱，请联系管理员
                            </div>
                        )
                    ) : (
                        ""
                    )}
                    {this.state.moreVisible && this.state.stepCurrent === 1 ? (
                        <div>
                            {this.state.loginAllocation.openSms &&
                            this.state.tel ? (
                                <Row
                                    type="flex"
                                    align="middle"
                                    style={{
                                        background: "#f7f7f7",
                                        height: 100,
                                        paddingLeft: 20,
                                        marginTop: 20,
                                        cursor: "pointer",
                                        border:
                                            this.state.telOrEmail === "tel"
                                                ? "1px dashed #39aee1"
                                                : "none"
                                    }}
                                    onClick={() =>
                                        this.setState({ telOrEmail: "tel" })
                                    }
                                >
                                    <img
                                        src={require("../../layouts/image/message.png")}
                                        alt=""
                                        style={{ marginRight: 10 }}
                                    />
                                    <div>
                                        <div style={{ fontSize: 14 }}>
                                            短信验证
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: "#999"
                                            }}
                                        >
                                            你需要密保手机进行短信验证
                                        </div>
                                    </div>
                                </Row>
                            ) : (
                                ""
                            )}
                            <Row
                                type="flex"
                                align="middle"
                                style={{
                                    background: "#f7f7f7",
                                    height: 100,
                                    paddingLeft: 20,
                                    marginTop: 20,
                                    cursor: "pointer",
                                    border:
                                        this.state.telOrEmail === "tel"
                                            ? "none"
                                            : "1px dashed #39aee1"
                                }}
                                onClick={() =>
                                    this.setState({ telOrEmail: "email" })
                                }
                            >
                                <img
                                    src={require("~/layouts/image/email.png")}
                                    alt=""
                                    style={{
                                        marginRight: 10,
                                        width: 58,
                                        marginLeft: 3
                                    }}
                                />
                                <div>
                                    <div style={{ fontSize: 14 }}>邮箱验证</div>
                                    <div
                                        style={{ fontSize: 12, color: "#999" }}
                                    >
                                        你需要绑定的邮箱进行验证
                                    </div>
                                </div>
                            </Row>
                        </div>
                    ) : (
                        ""
                    )}
                    {this.state.stepCurrent === 2 ? (
                        <div
                            className={
                                curScreen === "mobile"
                                    ? "mobile-center-box"
                                    : "center-box"
                            }
                        >
                            <Form
                                onSubmit={this.userPwdSubmit}
                                className="login-form"
                            >
                                <FormItem label="新密码" {...formItemLayout}>
                                    {getFieldDecorator("newPwd", {
                                        rules: [
                                            {
                                                validator: this
                                                    .validateToNextPassword
                                            }
                                        ]
                                    })(
                                        <Input
                                            prefix={
                                                <Icon
                                                    type="lock"
                                                    style={{
                                                        color: "rgba(0,0,0,.25)"
                                                    }}
                                                />
                                            }
                                            type="password"
                                            placeholder={
                                                this.state.loginAllocation
                                                    .codeRules
                                            }
                                        />
                                    )}
                                </FormItem>
                                <FormItem label="确认密码" {...formItemLayout}>
                                    {getFieldDecorator("reNewPwd", {
                                        rules: [
                                            {
                                                validator: this
                                                    .compareToFirstPassword
                                            }
                                        ]
                                    })(
                                        <Input
                                            prefix={
                                                <Icon
                                                    type="lock"
                                                    style={{
                                                        color: "rgba(0,0,0,.25)"
                                                    }}
                                                />
                                            }
                                            type="password"
                                            placeholder="请再次输入新密码"
                                            onBlur={this.handleConfirmBlur}
                                        />
                                    )}
                                </FormItem>
                                <FormItem>
                                    <Row
                                        type="flex"
                                        justify={curScreen === "mobile" ? "center" : ""}
                                    >
                                        <Col offset={curScreen === "mobile" ? 0 : 4}>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                className="login-form-button"
                                            >
                                                确认
                                            </Button>
                                        </Col>
                                    </Row>
                                </FormItem>
                            </Form>
                        </div>
                    ) : (
                        ""
                    )}
                    {this.state.stepCurrent === 3 ? (
                        <div
                            className={
                                curScreen === "mobile"
                                    ? "mobile-center-box"
                                    : "center-box"
                            }
                            style={{ textAlign: "center" }}
                        >
                            <div>
                                操作成功，将自动跳转到登录页。(
                                {this.state.turnNum}秒)
                            </div>
                            <div style={{ marginTop: 30, textAlign: "center" }}>
                                <Button
                                    type="primary"
                                    onClick={() =>
                                        this.props.history.push("/Login")
                                    }
                                >
                                    点击跳转
                                </Button>
                            </div>
                        </div>
                    ) : (
                        ""
                    )}
                </div>
            </Row>
        );
    }
}
const SecurityCenter = Form.create()(Security);
const SecurityCenterWrap = props => {
    return (
        <ContainerQuery query={QUERY}>
            {params => {
                let data=''
                for (let key in params) {
                    if(params[key]){
                        switch (`${key}`) {
                            //若当前窗口是手机
                            case "screen-xs" :
                                data='mobile';
                                break;
                            //若当前窗口是小屏
                            case "screen-md" :
                                data='sm-screen';
                                break;
                            //若当前窗口是大屏
                            case "screen-lg" :
                                data='big-screen';
                                break;
                            default :
                                data=''
                        }
                    }
                }
                //存入当前屏幕尺寸至reducer
                return (
                    <SecurityCenter {...props} curScreen={data}/>
                )
            }}
        </ContainerQuery>
    );
};
export default SecurityCenterWrap;
