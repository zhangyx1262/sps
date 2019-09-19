import React, {Component} from "react";
import {actions} from "mirrorx";
import {Col, Row,  FormControl, Label, Switch, Radio} from "tinper-bee";
import DatePicker from 'bee-datepicker';
import moment from "moment";
import FormList from 'components/FormList';
import FormError from 'components/FormError';
import Select from 'bee-select';
import PopDialog from 'components/Pop';
import FormControlPhone from 'components/FormControlPhone';
import RefCommon from 'components/RefCommon';
import zhCN from "rc-calendar/lib/locale/zh_CN";
import Header from "components/Header";
import queryString from 'query-string';
import Alert from 'components/Alert';
import Button from 'components/Button';
import './index.less'

const FormItem = FormList.Item;

const layoutOpt = null
const {Option} = Select;
const format = "YYYY-MM-DD";
let titleArr = ["新增", "修改", "详情"];

class AddEditquality extends Component {
    constructor(props) {
        super(props);
        this.state = {
            rowData: {},
            btnFlag: 0,
            showPopBackVisible: false
        }
    }
    componentDidMount(){
        const searchObj = queryString.parse(this.props.location.search);
        let { btnFlag: flag, checkTable: checkTable} = searchObj;
        const btnFlag = Number(flag);

        const { qualityObj, qualityIndex: currentIndex } = this.props;
        // 防止网络阻塞造成btnFlag显示不正常
        this.setState({btnFlag: btnFlag});
        let rowData = {};
        try {
            // 判断是否重后端请求数据
            if (btnFlag > 0 && checkTable === "quality") {
                this.props.form.resetFields();
                const {list} =qualityObj;
                rowData = list[currentIndex] || {};
            }
        } catch (error) {
            console.log(error);
        } finally {
            this.setState({rowData});
        }
    }
    /**
     * button关闭Modal 同时清空state
     * @param {Boolean} isSave 判断是否添加或者更新
     */
    onCloseEdit = (isSave) => {
        // 关闭当前 弹框清空当前的state的值，防止下次进入是上一次的数据
        this.setState({rowData: {}, btnFlag: 0});
        this.props.form.resetFields();
    }
    /**
     *  提交信息
     */
    onSubmitEdit = () => {
        const _this = this;
        const {btnFlag}=_this.state;
        this.props.form.validateFields(async (err, values) => {
            if (!err) {
                let {rowData} = _this.state;
                if (rowData && rowData.id) {
                    values.id = rowData.id;
                    values.ts = rowData.ts;
                }
                // 参照处理
                const {dept} = values;
                if (dept) {
                    const {refpk} = JSON.parse(dept);
                    values.dept = refpk;

                }
                // 是否会员，从state中取值
                const {isVip} = rowData;
                values.isVip = isVip;

                if(!isVip){ // 如果不是会员
                    values.grade = 0;
                    values.expirationDate = "";
                }

                try {
                    values.expirationDate = values.expirationDate.format(format);
                } catch (e) {
                }
                values.btnFlag=btnFlag;
                _this.onCloseEdit(true); // 关闭弹框 无论成功失败
                actions.masterDetailMany.savequality(values); //保存主表数据
                //返回
                actions.routing.replace({ pathname: '/' });
            }
        });
    }
     /**
     * 清空
     */
    clearQuery() {
        this.props.form.resetFields();
    }
    /**
     *
     * 返回上一级弹框提示
     * @param {Number} type 1、取消 2、确定
     * @memberof Order
     */
    async confirmGoBack(type) {
        this.setState({ showPopBackVisible: false });
        if (type === 1) { // 确定
            this.clearQuery();
            actions.routing.replace({ pathname: '/' });
        }
    }
     /**
     * 返回
     * @returns {Promise<void>}
     */
    onBack = async () => {
        const { btnFlag } = this.state;
        if (btnFlag === 2) { //判断是否为详情态
            const searchObj = queryString.parse(this.props.location.search);
            let { from } = searchObj;
            switch (from) {
                case undefined:
                    this.clearQuery();
                    actions.routing.replace({ pathname: '/' });
                    break;
                default:
                    window.history.go(-1);
            }

        } else {
            this.setState({ showPopBackVisible: true });
        }
    }
    render() {
        let _this = this;
        const {form, modalVisible} = _this.props;


        const {getFieldProps, getFieldError,} = form;
        const {rowData, btnFlag, showPopBackVisible } = _this.state;

        let isDisabled = btnFlag > 1 ? true : false;

        return (
            <div className="mainContainer">
                <Alert
                    show={showPopBackVisible}
                    context="数据未保存，确定离开 ?"
                    confirmFn={() => {
                        _this.confirmGoBack(1)
                    }}
                    cancelFn={() => {
                        _this.confirmGoBack(2)
                    }} />
                <Header back title={titleArr[btnFlag]}>
                    <div className='head-btn'>
                        <Button shape="border" className="ml8" onClick={_this.onBack}>取消</Button>
                        {(btnFlag !== 2) &&
                        <Button colors="primary" className="ml8" onClick={_this.onSubmitEdit}>保存</Button>
                        }
                    </div>
                </Header>
                <FormList className="formlist">
                                <FormItem>
        <Label className="mast">
            质检编号
        </Label>
        <FormControl disabled={typeof btnFlag != 'undefined' && btnFlag == 2
}
            {
            ...getFieldProps('qc_no', {
                validateTrigger: 'onBlur',
                initialValue: (typeof rowData === 'undefined' || typeof rowData.qc_no === 'undefined') ? "" : rowData.qc_no
,
                rules: [{
                    type:'string',required: true,pattern:/\S+/ig, message: '请输入质检编号',
                }],
                onChange(value) {
if(typeof rowData !== 'undefined'){
    let tempRow = Object.assign({},rowData,{ qc_no: value });
    _this.setState({
        rowData:tempRow
    })
}
                }
            }
            )}
        />
        <FormError errorMsg={getFieldError('qc_no')}/>
                                </FormItem>
                                <FormItem>
        <Label className="mast">
            订单编号
        </Label>
        <FormControl disabled={typeof btnFlag != 'undefined' && btnFlag == 2
}
            {
            ...getFieldProps('po_no', {
                validateTrigger: 'onBlur',
                initialValue: (typeof rowData === 'undefined' || typeof rowData.po_no === 'undefined') ? "" : rowData.po_no
,
                rules: [{
                    type:'string',required: true,pattern:/\S+/ig, message: '请输入订单编号',
                }],
                onChange(value) {
if(typeof rowData !== 'undefined'){
    let tempRow = Object.assign({},rowData,{ po_no: value });
    _this.setState({
        rowData:tempRow
    })
}
                }
            }
            )}
        />
        <FormError errorMsg={getFieldError('po_no')}/>
                                </FormItem>
                                <FormItem>
        <Label className="mast">
            质检状态
        </Label>
        <Select disabled={typeof btnFlag != 'undefined' && btnFlag == 2
}
            {
            ...getFieldProps('qc_state', {
                initialValue: (typeof rowData === 'undefined' || typeof rowData.qc_state === 'undefined') ? "" : String(rowData.qc_state)
,
                rules: [{
                    required: true, message: '请选择质检状态',
                }],
                onChange(value) {
if(typeof rowData !== 'undefined'){
    let tempRow = Object.assign({},rowData,{ qc_state: value });
    _this.setState({
        rowData:tempRow
    })
}
                }
            }
            )}>
            <Option value="">请选择</Option>
                <Option value={ '0' }>待质检</Option>
                <Option value={ '1' }>质检通过</Option>
                <Option value={ '2' }>质检未通过</Option>
        </Select>
        <FormError errorMsg={getFieldError('qc_state')}/>
                                </FormItem>
                </FormList>
            </div>
        )
    }
}

export default FormList.createForm()(AddEditquality);