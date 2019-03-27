import React, {Component} from "react"
import Api from "~/until/api"
import {isForbidden} from "~/until/common"
import * as Message from '~/components/common/message';
import {TableData, PopForm} from "cake-ui"
import {Modal, Button} from "antd";
import NotificationType from "~/components/NotificationType/NotificationType";

/*
* 发布消息
* */
class PublishList extends Component {
    constructor(props) {
        super(props)
        this.state = {
            // 新增或修改弹出框显示/隐藏
            addModalVisible: false,
            // 消息列表
            newsList: [],
            //发送消息中人员列表
            personList: [],
            // 角色列表
            roleList: [],
        }
        // 新增或修改弹出框配置
        this.addModalInitData = {};
        this.tableData = {}
    }

    componentDidMount() {
        /* 获取我发出的消息列表数据*/
        this.getMySend();
        this.getNoticeRole()
    }


    // 查询消息列表
    getMySend = (params) => {
        let newParams = params
        if (this.tableData) {
            newParams = {
                ...this.tableData.returnPage(),
                ...newParams,
            }
        }
        Api.getMySend(newParams)
            .then((res) => {
                this.setState({
                    newsList: res.content,
                });
            })
    }


    // 查询角色列表
    getNoticeRole() {
        // 模糊查询所有人员列表
        Api.getNoticeRole()
            .then((res) => {
                this.setState({
                    roleList: res.content.map(item => {
                        return {value: item.id, label: item.name}
                    })
                })
            })
    }


    // 新增消息
    publishNews() {
        // 显示新增、修改弹出框
        this.setState({addModalVisible: true})

        this.addModalInitData = {
            title: "发布消息",
            modalWidth: 700,
            itemList: [
                {
                    name: "标题",
                    type: "text",
                    keyName: "title",
                    placeholder: "请输入标题",
                    rules: [
                        {required: true, message: "请填写标题", whitespace: true}
                    ]
                },
                {
                    name: "内容",
                    type: "textarea",
                    keyName: "content",
                    placeholder: "请输入内容",
                    rows: 6,
                    rules: [
                        {required: true, message: "请填写内容", whitespace: true}
                    ]
                },
                {
                    name: "是否发送邮件",
                    type: "radio",//注：单选无权限控制
                    keyName: "isSendEmail",
                    defaultValue: 0,
                    options: [
                        {value: 1, label: "是"},
                        {value: 0, label: "否"}
                    ],
                    rules: [
                        {required: true, message: "请选择其中一项"}
                    ]
                },
                {
                    name: "通知人员",
                    type: "custom",
                    keyName: "sendType",
                    defaultValue: 1,
                    render: () => {
                        const options = [
                            {value: 1, label: "所有人"},
                            {value: 2, label: "按角色"},
                            {value: 3, label: "按人"}
                        ]
                        return <NotificationType departmentOptions={this.state.roleList}
                                                 options={options}
                                                 departmentKeyName="department"
                                                 personKeyName="menList"
                        />
                    },
                    /*departmentKeyName: "department",
                    departmentOptions: this.state.roleList,
                    personKeyName: "menList",
                    personList: this.searchPerson(""),//仅值传递，没有引用传递
                    searchPerson: str => this.searchPerson(str),*/
                    rules: [
                        {required: true, message: "请选择通知人员"}
                    ]
                }
            ],
            onOk: (json) => {
                // 新增消息
                console.log(json,"222")
                let sendTypeObj = json.sendType;
                json.department = sendTypeObj && sendTypeObj.department && sendTypeObj.department.join(",");
               json.menList = sendTypeObj.menList && sendTypeObj.menList.join(",");
               json.sendType = sendTypeObj.type;
                Api.addMessage(json) //请求成功后
                   .then((res) => {
                       // 显示新增成功
                       Message.success(res.message);
                       // 隐藏modal
                       this.setState({addModalVisible: false})
                       /* 重新获取我发出的消息列表数据*/
                       this.getMySend()
                   })
            },
            onCancel: () => {
                this.setState({addModalVisible: false})
            }
        }
    }

    // 查看消息
    viewMessage(id) {
        const detailName = [
            {key: "title", value: "标题"},
            {key: "createName", value: "创建人"},
            {key: "createTime", value: "创建时间"},
            {key: "content", value: "消息内容"}
        ]
        Api.getMessage({id}) //请求成功后
            .then((res) => {
                console.log(res, "res")
                if (res.status === "1") {
                    // 获取详情列表
                    let {data = {}} = res.content

                    Modal.info({
                        title: "消息详情",
                        okText: "知道了",
                        className: "detail-modal-verticle",
                        content: (
                            <div>
                                {
                                    detailName.map((item) => {
                                        return <p>
                                            <span className="title">{item.value}：</span>
                                            <span className="value">{data[item.key]}</span>
                                        </p>
                                    })
                                }
                            </div>
                        ),
                        onOk() {
                        }
                    });
                } else {
                    // 显示查询失败
                    Message.error(res.message);
                }
            })
    }


    //初始化表头数据
    getInitialTableHead() {
        const arr = ["否", "是"]
        //设置table的表头标题
        this.tableColumns = [
            {
                title: "标题",        //菜单内容
                dataIndex: "title",   //在数据中对应的属性
                key: "title",  //key
                width: 150
            },
            {
                title: "发布时间",
                dataIndex: "createTime",
                width: 150,
                key: "createTime"
            },
            {
                title: "是否抄送邮件",
                dataIndex: "isSendEmail",
                width: 150,
                key: "isSendEmail",
                render: isSendEmail => arr[isSendEmail]
            },
            {
                title: "操作",
                key: "operation",
                width: 150,
                render: (rowData) => {
                    return (  //塞入内容
                        <div className="table-action-container">
                            <a href="javascript: ;" onClick={() => {
                                this.viewMessage(rowData.id);
                            }}>查看</a>
                        </div>
                    )
                }
            }
        ];
        return this.tableColumns;
    }


    render() {
        return <div className="mySendNews_wrap common_wrap">
            {
                isForbidden("/message/base/addMessage") ? "" :
                    <div className="mb-10">
                        <Button type="primary" onClick={() => {
                            return this.publishNews()
                        }}>新增</Button>
                    </div>
            }
            <TableData columns={this.getInitialTableHead()}
                       dataSource={this.state.newsList}
                       queryData={this.getMySend}
                       intervalColor
                       ref={ins => {this.tableData = ins}}
            />
            {/*新增修改*/}
            <PopForm initData={this.addModalInitData} modalVisible={this.state.addModalVisible}/>

        </div>
    }

}


export default PublishList




