import React, { Component } from "react"
import Api from "~/until/api"
import { isForbidden } from "~/until/common"
import { checkPositiveNum, validator } from "~/until/validator";
import * as Message from '~/components/common/message';
import {TableData,PopForm} from "cake-ui"
import { Modal, Button } from "antd";
import moment from "moment";

/*
* 广播消息
* */
class BroadcastMessage extends Component {
    constructor(props) {
        super(props)
        this.state = {
            // 新增或修改弹出框显示/隐藏
            addModalVisible: false,
            // 消息列表
            newsList:[],
        }
        // 新增或修改弹出框配置
        this.addModalInitData = {};
        this.disabledDate = moment()
    }

    componentDidMount() {
        /* 获取我发出的消息列表数据*/
        this.queryBroadList();
    }


    // 查询广播列表
    queryBroadList = (params) => {
        Api.queryBroadList(params)
            .then((res) => {
                this.setState({
                    newsList: res.content,
                });
            })
    }


    // 新增广播
    addBroadNews(val,item={}) {
        this.disabledDate = item.startTime?moment(item.startTime):moment()
        // 显示新增、修改弹出框
        this.setState({ addModalVisible: true })

        this.addModalInitData = {
            title: val==="add"?"新增广播":"编辑广播",
            modalWidth: 700,
            itemList: [
                {
                    name: "广播id",
                    type: "text",
                    keyName: "id",
                    defaultValue:item.id?item.id:"",
                    visible:false
                },
                {
                    name: "标题",
                    type: "text",
                    keyName: "title",
                    defaultValue:item.title?item.title:"",
                    placeholder: "请输入标题",
                    rules: [
                        { required: true, message: "请填写标题", whitespace: true },
                        {
                            validator: (rule, value, callback) => {
                                if(value.length >= 25) {
                                    callback("请输入25个以内的字符")
                                }else {
                                    callback()
                                }
                            }
                        }
                    ]
                },
                {
                    name: "内容",
                    type: "textarea",
                    keyName: "content",
                    placeholder: "请输入内容",
                    defaultValue:item.content?item.content:"",
                    rows: 6,
                    rules: [
                        { required: true, message: "请填写内容", whitespace: true },
                        {
                            validator: (rule, value, callback) => {
                                if(value.length >= 65) {
                                    callback("请输入65个以内的字符")
                                }else {
                                    callback()
                                }
                            }
                        }
                    ]
                },
                {
                    name:"开始时间",
                    keyName:"startTime",
                    type:"datetime",
                    defaultValue:item.startTime?moment(item.startTime):"",
                    placeholder:"请选择开始时间",
                    rules: [
                        { required: true, message: "请选择开始时间" }
                    ],
                    onChange:(date) => {
                        this.disabledDate = date
                    },
                    disabledDate:(current)=>{
                        return current && current < moment().startOf('day');
                    }
                },
                {
                    name:"结束时间",
                    keyName:"endTime",
                    type:"datetime",
                    defaultValue:item.endTime?moment(item.endTime):"",
                    placeholder:"请选择结束时间",
                    rules: [
                        { required: true, message: "请选择结束时间" }
                    ],
                    disabledDate:(current) => {
                        return current && current < this.disabledDate
                    }
                },
                {
                    name:"间隔时间",
                    type: "text",
                    keyName: "intervalTime",
                    placeholder: "请输入间隔时间",
                    defaultValue:item.intervalTime?`${item.intervalTime}`:"",
                    rules: [
                        { required: true, message: "请填写间隔时间", whitespace: true },
                        {
                            validator: (rule, value, callback) => {
                                validator(value, callback, checkPositiveNum, "请填写数字")
                            }
                        }
                    ]
                },
                {
                    name: "间隔类型",
                    type: "radio",//注：单选无权限控制
                    keyName: "type",
                    defaultValue:item.type?`${item.type}`:"1",
                    options: [
                        { value: "1", label: "分钟" },
                        { value: "2", label: "小时" }
                    ],
                    rules: [
                        { required: true, message: "请选择其中一项" }
                    ]
                }
            ],
            onOk: (json)=> {
                json.startTime=json.startTime.format("YYYY-MM-DD HH:mm:ss")
                json.endTime=json.endTime.format("YYYY-MM-DD HH:mm:ss")
                Api.addOrUpdateBroad(json) //请求成功后
                    .then((res) => {
                        Message.success(res.message);
                        this.setState({ addModalVisible: false })
                        /* 重新获取广播列表数据*/
                        this.queryBroadList(this.tableData.returnPage())
                    })
            },
            onCancel: ()=> {
                this.setState({ addModalVisible: false })
            }
        }
    }

    // 查看消息id
    viewMessage(rowData) {
        const detailName = [
            { key: "title", value: "标题" },
            { key: "startTime", value: "开始时间" },
            { key: "endTime", value: "结束时间" },
            { key: "intervalTime", value: "间隔（分钟）" },
            { key: "alterTime", value: "修改时间" },
            { key: "statusName", value: "状态" },
            { key: "content", value: "广播内容" }
        ]
        //  status： 1:进行中 2:未开始 3:已结束
        const arr=['','进行中','未开始','已结束']
        rowData.statusName = arr[rowData.status]
        Modal.info({
            width:700,
            title: "广播详情",
            okText: "知道了",
            className: "detail-modal-verticle",
            content: (
                <div>
                    {
                        detailName.map((detail) => {
                            return <p>
                                <span className="title">{detail.value}：</span>
                                <span className="value">{rowData[detail.key]}</span>
                            </p>
                        })
                    }
                </div>
            ),
            onOk() { }
        });
    }
    // 删除广播
    deleteBroad(id) {
        // 删除角色
        Modal.confirm({
            title: "您确定删除该广播吗？",
            okText: "确定",
            cancelText: "取消",
            onOk:()=> {
                Api.delBroad({id})
                    .then((res) => {
                        // 显示删除成功
                        Message.success(res.message);
                        /* 重新获取广播列表数据*/
                        this.queryBroadList(this.tableData.returnPage())
                    })
            },
            onCancel() {
            }
        });
    }

    //初始化表头数据
    getInitialTableHead() {
        //设置table的表头标题
        this.tableColumns = [
            {
                title: "广播标题",        //菜单内容
                dataIndex: "title",   //在数据中对应的属性
                key: "title" ,  //key
                width: 150
            },
            {
                title: "开始时间",
                dataIndex: "startTime",
                width: 150,
                key: "startTime",
            },
            {
                title: "间隔（分钟）",
                dataIndex: "intervalTime",
                width: 150,
                key: "intervalTime",
            },
            {
                title: "内容",
                dataIndex: "content",
                width: "25%",
                key: "content",
            },
            {
                title: "状态",
                dataIndex: "status",
                width: 150,
                key: "status",
                render:status =>{
                     // 1:进行中 2:未开始 3:已结束
                    const arr=['','进行中','未开始','已结束']
                    return arr[status]
                }
            },
            {
                title: "操作",
                key: "operation",
                width: 150,
                render: (rowData) => {
                    return (  //塞入内容
                        <div className="table-action-container">
                            <a href="javascript: ;" onClick={() => { this.viewMessage(rowData); }}>查看</a>
                            <a href="javascript: ;" onClick={() => { this.addBroadNews("update",rowData); }}>编辑</a>
                            <a href="javascript: ;" onClick={() => { this.deleteBroad(rowData.id); }}>删除</a>
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
                        <Button type="primary" onClick={() => { return this.addBroadNews("add") }}>新增</Button>
                    </div>
            }
            <TableData columns={this.getInitialTableHead()}
                       dataSource={this.state.newsList}
                       queryData={this.queryBroadList}
                       intervalColor
                       ref={ins => this.tableData=ins}
            />
            {/*新增修改*/}
            <PopForm initData={this.addModalInitData} modalVisible={this.state.addModalVisible} />

        </div>
    }

}


export default BroadcastMessage




