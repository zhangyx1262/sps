import React, {Component} from 'react'
import {actions} from 'mirrorx';
import {Tabs, Loading} from 'tinper-bee';
import Grid from 'components/Grid';
import Header from 'components/Header';
import Button from 'components/Button';
import Alert from 'components/Alert';
import moment from 'moment';
import ButtonRoleGroup from 'components/ButtonRoleGroup';
import AcAttachment from 'ac-attachment';
import RefCommon from 'components/RefCommon';

import SearchArea from '../SearchArea/index';


import {deepClone, Warning, getPageParam,success} from "utils";
import 'ac-attachment/dist/ac-attachment.css';
import './index.less'

const {TabPane} = Tabs;
const format = "YYYY-MM-DD";

export default class IndexView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            delModalVisible: false,
            modalVisible: false, // 添加、编辑、详情 弹框
            delPicModalVisible: false, // 添加、编辑、详情 弹框
            checkTable: "pr", //选中的表名 用于modal 弹框标记
            flag: -1, //按钮状态
        }

    }

    componentDidMount() {
        this.loadPage();
    }
    /**
     *
     *获取主表数据
     * @param {Object} [searchParam={}]
     */
    loadPage = (searchParam = {}) => {
        const initPage = {pageIndex: 0, pageSize: 5};
        actions.masterDetailMany.loadList({...initPage, ...searchParam});
    }
    /**
     *
     * 关闭弹框 view update modal
     * @param {Boolean} isSave 判断是否添加或者更新
     * */
    onCloseModal = (isSave = false) => {
        this.setState({modalVisible: false, flag: -1});
        if ((typeof isSave) === 'boolean') {
            this.child.reset();
        }

    }

    /**
     *
     *
     * @param {string} resetObj 重置state，默认选中第一条
     */
    resetIndex = (resetObj) => {
        this.setState({[resetObj]: 0})
    }


    /**
     *
     *tab 切换
     * @param {string} tabKey uploadFill为文件上传，emergency子表，traveling子表
     */
    onChangeTab = (tabKey) => {
        if (tabKey !== "uploadFill") { // 判断是否文件上传
            const {prObj, prIndex, searchParam} = this.props;
            const {pageSize} = this.props[tabKey + "Obj"];
            const {id: search_NA} = prObj.list[prIndex] || {};
            if (search_NA) { //如果主表有数据，子表在获取数据
                const param = {search_NA, pageIndex: 0, pageSize};
            }
        }
        actions.masterDetailMany.updateState({tabKey});
    }


    /**
     * 显示删除弹框
     */
    onClickDel = (checkTable) => {
        this.setState({delModalVisible: true, checkTable});
    }

    /**
     *
     * @param {Number} pageIndex 当前分页值 第几条
     * @param {string} tableObj 分页 table 名称
     */
    freshData = (pageIndex, tableObj) => {
        this.onPageSelect(pageIndex, 0, tableObj);
    }


    /**
     *
     * @param {number} pageIndex 当前分页值 第几条
     * @param {number} value 分页条数
     * @param {string} tableObj 分页table名称
     */
    onDataNumSelect = (pageIndex, value, tableObj) => {
        this.onPageSelect(value, 1, tableObj);
    }

    /**
     *
     *
     * @param {number} value  pageIndex 或者 pageSize值
     * @param {string} type  type为0标识为 pageIndex,为1标识 pageSize,
     * @param {string} tableName 分页table名称
     */
    onPageSelect = (value, type, tableName) => {
        let searchParam = deepClone(this.props.searchParam);
        let modalObj = this.props[tableName];

        let {pageIndex, pageSize} = getPageParam(value, type, modalObj);

        if (tableName === "prObj") { //主表分页
            searchParam.pageSize = pageSize;
            searchParam.pageIndex = pageIndex;
            actions.masterDetailMany.loadList(searchParam);
        } else {
            //子表分页
            const {prIndex, prObj} = this.props;
            const {id: search_NA} = prObj.list[prIndex];

        }
        actions.masterDetailMany.updateState({searchParam});
    }
    /**
     * @description 该方法为页面打印调用方法,打印功能需要先查询打印模板，再调打印接口
     *
     */
    onPrint = () => {
        const {prIndex, prObj} = this.props;
        const {list} = prObj;
        if (list.length === 0) {
            Warning('请选择需打印的数据');
            return;
        }
        const {id} = list[prIndex] || {};
        actions.masterDetailMany.printDocument({
            queryParams: {
                funccode: 'request',
                nodekey: 'pr'
            },
            printParams: {id: id}
        });

    }
    /**
     *
     * @param {string} type 当前选中的table
     * @param {number} status 状态 0 添加，1 编辑 2. 详情
     */
    onShowMainModal = (type, status) => {
        actions.routing.push(
            {
                pathname: '/main',
                search: `?checkTable=${type}&btnFlag=${status}`
            }
        )
    }
    /**
     *
     * @param {string} type 当前选中的table
     * @param {number} status 状态 0 添加，1 编辑 2. 详情
     */
    onShowModal = (type, status) => {
        this.setState({
            modalVisible: true,
            flag: status,
            checkTable: type,
        });
    }
    /**
     *删除确定操作
     * @param {number} type 1.删除 2.取消
     */
    async confirmGoBack(type) {
        const {checkTable} = this.state; //获取删除的表名
        const {list} = this.props[checkTable + "Obj"];
        this.setState({delModalVisible: false});
        if (type === 1 && list.length > 0) {
            if (checkTable === "pr") { // 主表
                const {prIndex} = this.props;
                const record = list[prIndex];
                await actions.masterDetailMany.delpr(record);
            }
        }
    }
    /**
     *删除确定操作
     * @param {number} type 1.删除 2.取消
     */
    async confirmDelPic(type) {
        if (type === 1) {
            this.attach.fDelete();
        }
        this.setState({delPicModalVisible: false});
    }

    prColumn = [
        {
            title: "申请单编号",
            dataIndex: "pr_no",
            key: "pr_no",
            width: 150,
        },
        {
            title: "采购品名",
            dataIndex: "pname",
            key: "pname",
            width: 150,
        },
        {
            title: "采购数量",
            dataIndex: "pnum",
            key: "pnum",
            width: 150,
        },
        {
            title: "采购单价",
            dataIndex: "price",
            key: "price",
            width: 150,
        },
        {
            title: "申请时间",
            dataIndex: "ptime",
            key: "ptime",
            width: 150,
                render: (text, record, index) => {
                    return <div>
                        {text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : ""}
                    </div>
                },
        },
        {
            title: "申请状态",
            dataIndex: "pstuteEnumValue",
            key: "pstuteEnumValue",
            width: 150,
                render(text,record,index){
                    return record['pstuteEnumValue'];
                }
        },
    ];

    /**
     *
     *导出excel
     * @param {string} type 导出某个表
     */
    export = (type) => {
        this.refs[type].exportExcel();
    }
    /**
     *
     * 费用合计
     * @param {Array} data 费用原始数据
     * @returns
     */
    getTotalCost = (data) => {
        let cost = 0;
        for (const item of data) {
            if (item.cost) cost += Number(item.cost);
        }
        return cost;
    }
    /**
     *
     * @param {Object} data 组装分页参数
     */
    getBasicPage = (data) => {
        const {pageIndex, total, totalPages} = data;
        return {   // 分页
            activePage: pageIndex,//当前页
            total: total,//总条数
            items: totalPages,
            dataNum: 1, //默认数组第一个值
        };
    }
    onRef = (ref) => {
        this.child = ref
    }
    render() {
        const _this = this;
        const {
            prObj, 
            prIndex,
            showLoading,
            tabKey
        } = this.props;
        const {
            delModalVisible, modalVisible, flag, checkTable,
            delPicModalVisible
        } = this.state;

        let selectRow = prObj['list'][prIndex] || {};
        // 主表数据为空
        const prForbid = prObj.list.length > 0 ? false : true;
        let {list} = prObj;
        const {id} = list[prIndex] || {};

        return (
            <div className='master-detail-many'>
                <Header title='采购申请'/>
                <SearchArea prObj={prObj} onRef={this.onRef}/>
                <div className='table-header'>
                    <ButtonRoleGroup funcCode="request">
                        <Button
                            className="ml8"
                            role="add"
                            colors="primary"
                            onClick={() => this.onShowMainModal('pr', 0)}
                        >新增</Button>
                        <Button
                            className="ml8"
                            role="update"
                            shape='border'
                            disabled={prForbid}
                            onClick={() => _this.onShowMainModal("pr", 1)}
                        >修改</Button>
                        <Button
                            className="ml8"
                            shape='border'
                            disabled={prForbid}
                            onClick={() => _this.onShowMainModal("pr", 2)}
                        >详情</Button>
                        <Button
                            className="ml8"
                            role="delete"
                            shape='border'
                            disabled={prForbid}
                            onClick={() => _this.onClickDel("pr")}
                        >删除</Button>
                    </ButtonRoleGroup>
                </div>
                <Grid
                    ref="pr"
                    data={prObj.list}
                    rowKey={(r, i) => i}
                    columns={_this.prColumn}
                    getSelectedDataFunc={this.getSelectedDataFunc}
                    showHeaderMenu={true}
                    draggable={true}
                    multiSelect={false}
                    onRowClick={(record, index) => {
                        actions.masterDetailMany.updateState({prIndex: index});
                        // 根据tab 页来获取子表数据
                        const {
                            prObj, 
                            tabKey, 
                            searchParam
                        } = this.props;
                        
                        const {list} = prObj;
                        const {id: search_NA} = list[index];
                        let param = {pageIndex: 0, search_NA};
                    }}
                    rowClassName={(record, index, indent) => { //判断是否选中当前行
                        return prIndex === index ? "selected" : "";
                    }}
                    paginationObj={{
                        ...this.getBasicPage(prObj),
                        freshData: (pageSize) => {
                            _this.freshData(pageSize, "prObj");
                        },
                        onDataNumSelect: (index, value) => {
                            _this.onDataNumSelect(index, value, "prObj");
                        },
                        dataNum: 0,
                    }}
                />
                <div className="table-space"> </div>
                <div className={prForbid? "tabel-header-wrap-hide":"tabel-header-wrap"} >
                    <Tabs
                        defaultActiveKey={tabKey}
                        onChange={this.onChangeTab}
                    >
                    </Tabs>
                </div>


                <Loading
                    loadingType="line"
                    show={showLoading}
                    fullScreen={true}
                />
                <Alert
                    show={delModalVisible}
                    context="确定删除这条记录吗 ?"
                    confirmFn={() => _this.confirmGoBack(1)}
                    cancelFn={() => _this.confirmGoBack(2)}/>

                <Alert
                    show={delPicModalVisible}
                    context="确定删除文件吗 ?"
                    confirmFn={() => _this.confirmDelPic(1)}
                    cancelFn={() => _this.confirmDelPic(2)}/>
            </div>

        )

    }
}