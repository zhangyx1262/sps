
import React, {Component} from 'react'
import {actions} from "mirrorx";
import {Col, Row, FormControl, Label, Radio} from "tinper-bee";
import DatePicker from 'bee-datepicker';
import moment from "moment";
import Select from 'bee-select';
import FormList from 'components/FormList';
import FormError from 'components/FormError';
import SearchPanel from 'components/SearchPanel';
import FormControlPhone from 'components/FormControlPhone';
import RefCommon from 'components/RefCommon';
import {addSearchKey} from 'utils';

import './index.less'

const FormItem = FormList.Item;

const layoutOpt = null

class SearchArea extends Component {

    constructor(props) {
        super(props);
        this.state = {}

    }

    componentDidMount(){
        this.props.onRef(this)
    }

    /** 查询数据
     * @param {*} error 校验是否成功
     * @param {object} values 表单数据
     */
    search = () => {
        this.props.form.validateFields(async (err, values) => {
            const {rejectedObj} = this.props;
            const {pageSize} = rejectedObj;
            values.pageIndex = 0;  // 默认回到第一页
            values.pageSize = pageSize;
            addSearchKey(values);
            actions.masterDetailMany.updateState({searchParam: values}); // 将查询数据放在 model里
            await actions.masterDetailMany.loadList(values);
        });
    }

    /**
     * 清空 action里的搜索条件
     */
    reset = () => {
        this.props.form.resetFields();
        actions.masterDetailMany.updateState({searchParam: {}});
    }

    render() {
        const {form} = this.props;
        const {getFieldProps} = form;
        return (
            <SearchPanel
                className="small"
                form={form}
                reset={this.reset}
                search={this.search}>
                <FormList>
                              <FormItem>
        <Label >
            退货单编号
        </Label>
        <FormControl disabled={typeof btnFlag != 'undefined' && btnFlag == 2
}
            {
            ...getFieldProps('rj_no', {
                validateTrigger: 'onBlur',
                initialValue: (typeof rowData === 'undefined' || typeof rowData.rj_no === 'undefined') ? "" : rowData.rj_no
,
                rules: [{
                    type:'string',required: true,pattern:/\S+/ig, message: '请输入退货单编号',
                }],
                onChange(value) {
if(typeof rowData !== 'undefined'){
    let tempRow = Object.assign({},rowData,{ rj_no: value });
    _this.setState({
        rowData:tempRow
    })
}
                }
            }
            )}
        />
                              </FormItem>
                              <FormItem>
        <Label >
            质检单编号
        </Label>
        <FormControl disabled={typeof btnFlag != 'undefined' && btnFlag == 2
}
            {
            ...getFieldProps('qc_no', {
                validateTrigger: 'onBlur',
                initialValue: (typeof rowData === 'undefined' || typeof rowData.qc_no === 'undefined') ? "" : rowData.qc_no
,
                rules: [{
                    type:'string',required: true,pattern:/\S+/ig, message: '请输入质检单编号',
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
                              </FormItem>
                              <FormItem>
        <Label >
            退货状态
        </Label>
        <Select disabled={typeof btnFlag != 'undefined' && btnFlag == 2
}
            {
            ...getFieldProps('rjstate', {
                initialValue: (typeof rowData === 'undefined' || typeof rowData.rjstate === 'undefined') ? "" : String(rowData.rjstate)
,
                rules: [{
                    required: true, message: '请选择退货状态',
                }],
                onChange(value) {
if(typeof rowData !== 'undefined'){
    let tempRow = Object.assign({},rowData,{ rjstate: value });
    _this.setState({
        rowData:tempRow
    })
}
                }
            }
            )}>
            <Option value="">请选择</Option>
                <Option value={ '0' }>待退货</Option>
                <Option value={ '1' }>已退货</Option>
        </Select>
                              </FormItem>
                </FormList>
            </SearchPanel>
        )
    }
}

export default FormList.createForm()(SearchArea)