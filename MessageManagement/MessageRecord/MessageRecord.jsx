import React, { Component } from "react";
import { connect } from "react-redux";
import Api from "~/until/api";
import { PAGE_SIZE_OPTIONS } from "~/constants/const";
import { setNoReadNewsList } from "~/action/setNoReadNewsList";
import * as Message from "~/components/common/message";
import {TableData,SearchForm} from "cake-ui"
import { Modal, Tabs } from "antd";
import "./MessageRecord.less";

const TabPane = Tabs.TabPane;
const confirm = Modal.confirm;
const messageType = [
    { value: -1, label: "全部" },
    { value: 0, label: "未读" },
    { value: 1, label: "已读" }
];


class NewsList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pageInfo: {
                pageNo: 1, // 当前页
                total: 0, // 数据总量
                pageSize: PAGE_SIZE_OPTIONS[0]
            },
            curScreen:"",
            messageList: [],
            inform_type: {} //消息类型
        };
        this.tab = -1;
    }

    componentDidMount() {
        /* 获取消息列表数据*/
        this.getMyMessage();
        // 获取消息类型（来自字典表）
        this.queryDict({ type: "inform_type" });
        if(sessionStorage.getItem("openMessage")) {
            this.viewMessage(JSON.parse(sessionStorage.getItem("openMessage")),0)
        }
        sessionStorage.setItem("openMessage","")
    }
    static getDerivedStateFromProps = (props,prevState) => {
        const { curScreen } = props;
        return {
            curScreen
        }
    }
    // 获取消息类型（来自字典表）
    queryDict = params => {
        Api.queryDict(params).then(res => {
            if (`${res.status}` === "1") {
                let { dictDtos = [] } = res.content;
                let inform_type = {};
                for (let i in dictDtos) {
                    inform_type[dictDtos[i].code] = dictDtos[i].name;
                }
                this.setState({
                    inform_type
                });
            } else {
                console.log("请求字典表失败!");
            }
        });
    };

    // 请求消息列表
    getMyMessage = (params) => {
        let searchJson = this.searchForm? this.searchForm.json : {}
        let returnPage = this.tableData?this.tableData.returnPage():{}
        let newParams = {
            ...searchJson,
            type: this.tab,
            ...returnPage,
            ...params
        };
        Api.getMyMessage(newParams).then(res => {
            this.setState({
                messageList: res.content
            });
        });
    };

    // 设为已读：id :"" 全部设为已读
    markToRead (id) {
        Api.setRead({ id }).then(res => {
            this.getMyMessage()
            // 显示设为已读成功Alert
            Message.success(res.message);
        });
    };

    // 删除消息
    delMessage = (e, id, status) => {
        e.preventDefault();
        e.stopPropagation();
        confirm({
            title: "您确定删除该消息吗?",
            okText: "确定",
            cancelText: "取消",
            onOk: () => {
                Api.delMessage({ id }).then(res => {
                    // 显示设为已读成功Alert
                    Message.success(res.message);
                    // 重新请求消息列表
                    this.getMyMessage();
                });
            },
            onCancel() {}
        });
    };

    // 查看消息
    viewMessage(id,status) {
        const detailName = [
            { key: "title", value: "标题" },
            { key: "createName", value: "创建人" },
            { key: "createTime", value: "创建时间" },
            { key: "content", value: "消息内容" }
        ]
        Api.getMessage({ id }) //请求成功后
            .then((res) => {
                if ( res.status === "1") {
                    // 获取详情列表
                    let { data = {} } = res.content

                    Modal.info({
                        title: "消息详情",
                        okText: "知道了",
                        className: "detail-modal-verticle",
                        width:600,
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
                        onOk() { }
                    });
                    if(`${status}` === "0") {
                        this.markToRead(id)
                    }
                } else {
                    // 显示查询失败
                    Message.error(res.message);
                }
            })
    }

    // 改变当前显示面板
    changePanel(index) {
        this.tab = index; //面板id
        this.getMyMessage({ pageNo: 1 });
    }

    //初始化表头数据
    getInitialTableHead = () => {
        //设置table的表头标题
        this.tableColumns = [
            {
                width: "40%",
                title: "标题", //菜单内容
                key: "title", //key
                render: rowData => {
                    return (
                        <a onClick={() => this.viewMessage(rowData.id,rowData.status)}>
                            {rowData.title}
                            {
                                `${rowData.status}` === "0" ?
                                    <span style={{
                                        display:"inline-block",
                                        marginLeft: 4,
                                        height: 6,
                                        width: 6,
                                        borderRadius: 3,
                                        background: "red"
                                    }}
                                />:""
                            }
                        </a>
                    );
                }
            },
            {
                width: "30%",
                title: "创建时间",
                dataIndex: "createTime",
                key: "createTime"
            },
            {
                title: "操作",
                key: "operation",
                render: rowData => {
                    return (
                        <div className="table-action-container">
                            {`${rowData.status}` === "0" ? (
                                <span>
                                    <a
                                        href="javascript:;"
                                        onClick={() =>
                                            this.markToRead(rowData.id)
                                        }
                                    >
                                        设为已读
                                    </a>
                                    <a
                                        href="javascript:;"
                                        onClick={e =>
                                            this.delMessage(
                                                e,
                                                rowData.id,
                                                rowData.status
                                            )
                                        }
                                    >
                                        删除
                                    </a>
                                </span>
                            ) : (
                                <a
                                    href="javascript:;"
                                    onClick={e =>
                                        this.delMessage(
                                            e,
                                            rowData.id,
                                            rowData.status
                                        )
                                    }
                                >
                                    删除
                                </a>
                            )}
                        </div>
                    );
                }
            }
        ];
        return this.tableColumns;
    };


    render() {
        const { curScreen } = this.state
        const searchConfig = [
            {
                name: "标题",
                keyName: "title",
                type: "text",
                colSpan: 6,
                placeholder: "请输入标题",
                defaultValue:""
            }
        ];

        return (
            <div className="newsList_wrap common_wrap">
                {/* 过滤列表 */}
                <div
                    style={{ position: "relative" }}
                    className="search-form-cotnainer"
                >
                    <SearchForm
                        config={searchConfig}
                        buttonsColSpan={4}
                        search={() => {this.getMyMessage({ pageNo: 1 });}}
                        wrappedComponentRef={ins => {return (this.searchForm = ins)}}
                    />
                    {/*右上角操作*/}
                    <div className={curScreen === "mobile" ?"mobile-message-button message-action-button":"message-action-button"}>
                        <span>
                            <a
                                href="javascript:;"
                                onClick={() => this.markToRead("")}
                            >
                                全部标记已读
                            </a>
                        </span>
                    </div>
                </div>
                <div className="newsList">
                    <Tabs
                        onChange={activeKey => this.changePanel(activeKey)}
                        animated={false}
                    >
                        {messageType.map(group => {
                            return (
                                <TabPane tab={group.label} key={group.value}>
                                    <div className="table-container">
                                        <TableData
                                            columns={this.getInitialTableHead()}
                                            intervalColor
                                            queryData={params =>
                                                this.getMyMessage(params)
                                            }
                                            dataSource={this.state.messageList}
                                            ref={ins => (this.tableData = ins)}
                                        />
                                    </div>
                                </TabPane>
                            );
                        })}
                    </Tabs>
                    {/* <List
                    itemLayout="vertical"
                    size="large"
                    pagination={{
                        current: this.state.pageInfo.pageNo,
                        total: this.state.pageInfo.total,
                        pageSize: this.state.pageInfo.pageSize,
                        pageSizeOptions: PAGE_SIZE_OPTIONS,
                        showSizeChanger: true,
                        onChange:this.changePage,
                        onShowSizeChange:this.toSelectchange,
                        showTotal: () => {  //设置显示一共几条数据
                            return "共 " + this.state.pageInfo.total + " 条数据";
                        }
                    }}
                    dataSource={this.state.messageList}
                    renderItem={(item) => {
                        return <div className="news-list-item" onClick={(e) => {
                            this.expandList(e, item.status, item.id)
                        }}>
                            <List.Item
                                key={item.id}
                                //操作列表
                                actions={this.actionsList(item)}
                            >
                                <List.Item.Meta
                                    title={
                                        `${item.status}` === "0" ?
                                            <Badge dot style={{top: 0}}>
                                                <span style={{marginRight: 5}}>{item.title}</span>
                                            </Badge> :
                                            <span>{item.title}</span>
                                    }
                                    description={<Icon type="right" theme="outlined" className="arrow"/>}
                                />
                                {item.content}
                            </List.Item>
                        </div>
                    }}
                /> */}
                </div>
            </div>
        );
    }
}

//传递redux中的state属性到组件属性中
const mapStateToProp = state => {
    return state;
};
export default connect(mapStateToProp)(NewsList);
