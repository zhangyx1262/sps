package com.yonyou.review.controller;
import com.yonyou.order.dto.Req_orderDTO;
import com.yonyou.order.po.Req_order;
import com.yonyou.order.service.Req_orderService;
import com.yonyou.request.dto.PrDTO;
import com.yonyou.request.po.Pr;
import com.yonyou.request.service.PrService;
import com.yonyou.review.po.Rl;
import com.yonyou.review.dto.RlDTO;
import com.yonyou.review.service.RlService;
import com.yonyou.review.dto.SimpleSearchDTO;
import com.yonyou.iuap.baseservice.service.util.SearchUtil;
import com.yonyou.iuap.baseservice.entity.annotation.Associative;
import com.yonyou.iuap.baseservice.vo.GenericAssoVo;
import com.yonyou.iuap.mvc.constants.RequestStatusEnum;
import com.yonyou.iuap.mvc.type.JsonResponse;
import com.yonyou.iuap.ucf.dao.support.UcfPage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.io.Serializable;
import java.util.List;
import java.util.ArrayList;
/**
* 说明：审核单基础Controller——提供数据增(CREATE)、删(DELETE、改(UPDATE)、查(READ)等rest接口
* @author  
* @date 2019-9-12 16:25:57
*/
@RestController("com.yonyou.review.controller.RlController")
@RequestMapping(value = "/review/rl")
public class RlController extends BaseController{

    private Logger logger = LoggerFactory.getLogger(RlController.class);
    private final static  int PAGE_FLAG_LOAD_ALL = 1;
    private RlService service;

    @Autowired
    private PrService prService;
    @Autowired
    private Req_orderService orderservice;
    @Autowired
    public void setRlService(RlService service) {
        this.service = service;
    }
    /**
    * 分页查询
    * @return 分页集合
    */
    @RequestMapping(value = "/list", method = RequestMethod.GET)
    @ResponseBody
    public Object list(@RequestParam( defaultValue = "0")Integer pageIndex,@RequestParam( defaultValue = "10")Integer pageSize
            ,@RequestParam(required = false) String search_rl_no
            ,@RequestParam(required = false) String search_pr_no
            ,@RequestParam(required = false) String search_rstute
    ) {
        SimpleSearchDTO searchDTO = new SimpleSearchDTO();
            searchDTO.setSearch_rl_no(search_rl_no);
            searchDTO.setSearch_pr_no(search_pr_no);
            searchDTO.setSearch_rstute(search_rstute);
        PageRequest pageRequest;
        Sort sort= SearchUtil.getSortFromSortMap(searchDTO.getSorts(),Rl.class);
        try {
            if (pageSize== PAGE_FLAG_LOAD_ALL) {
                pageRequest =
                        PageRequest.of(pageIndex,Integer.MAX_VALUE-1,sort);
            }else{
                pageRequest=PageRequest.of(pageIndex,pageSize,sort);
            }
            Page<Rl> page = this.service.selectAllByPage(pageRequest, searchDTO.toSearchParams(Rl.class) );
            List<RlDTO> dtoList = new ArrayList<>();
            for (Rl po:page.getContent()){
                RlDTO dto = new RlDTO();
                BeanUtils.copyProperties(po,dto);
                dtoList.add(dto);
            }
            Page<RlDTO> dtoPage = new UcfPage<>(dtoList,page.getPageable(),page.getTotalElements());
            return this.buildSuccess(dtoPage);
        } catch (Exception exp) {
            logger.error("exp", exp);
            return this.buildError("msg", "Error query database", RequestStatusEnum.FAIL_FIELD);
        }
    }

    /**
     * 单条查询，获取审核表中的申请内容
     * @return 要获取的数据
     */
    @RequestMapping(value = "/getRequestById" , method = RequestMethod.GET)
    @ResponseBody
    public Object  getRequestById(@RequestParam(required = false) String search_ID){
        //获取审核单
        GenericAssoVo<Rl> reviewlistvo = service.getAssoVo(search_ID);
        //获取申请单id
        String prNo=reviewlistvo.getEntity().getPr_no();
        String prid=prNo.substring(prNo.indexOf("/")+1);
        //获取申请单内容
        GenericAssoVo<Pr> requestvo=prService.getAssoVo(prid);
        return this.buildSuccess(requestvo.getEntity()) ;
    }

    /**
     * 审核通过
     */
    @RequestMapping(value = "/reviewRl" , method = RequestMethod.POST)
    @ResponseBody
    public Object reviewRl(@RequestBody List<Rl> listData){
        //获取审核单id
        Rl entity=listData.get(0);
        String rlId=entity.getId();
        //获取审核单
        Rl rlentity=service.getAssoVo(rlId).getEntity();
        //修改审核状态
        rlentity.setRstute("1");
        //保存修改
        rlentity=service.save(rlentity,false,true);
        RlDTO rlDTO= new RlDTO();
        BeanUtils.copyProperties(rlentity,rlDTO);

        String prno=rlentity.getPr_no().substring(0,rlentity.getPr_no().indexOf("/"));
        String prid=rlentity.getPr_no().substring(rlentity.getPr_no().indexOf("/")+1);

        //新增采购订单
        Req_order odentity=new Req_order();
        odentity.setId("采购"+prno);
        odentity.setRo_no("采购"+prno);
        odentity.setRl_no(rlentity.getRl_no());
        odentity.setPostate("0");

        odentity = this.orderservice.save(odentity,true,true);
        Req_orderDTO oddto = new Req_orderDTO();
        BeanUtils.copyProperties(odentity,oddto);

        //修改申请单状态
        Pr prentity= this.prService.getAssoVo(prid).getEntity();
        prentity.setPstute("2");//已申请/审核通过
        prentity=this.prService.save(prentity,false,true);
        PrDTO prDTO= new PrDTO();
        BeanUtils.copyProperties(prentity,prDTO);

        return this.buildSuccess();
    }

    /**
     * 审核不通过
     */
    @RequestMapping(value = "/dreviewRl" , method = RequestMethod.POST)
    @ResponseBody
    public Object dreviewRl(@RequestBody List<Rl> listData){
        //获取审核单id
        Rl entity=listData.get(0);
        String rlId=entity.getId();
        //获取审核单
        Rl rlentity=service.getAssoVo(rlId).getEntity();
        //修改审核状态
        rlentity.setRstute("2");
        //保存修改
        rlentity=service.save(rlentity,false,true);
        RlDTO rlDTO= new RlDTO();
        BeanUtils.copyProperties(rlentity,rlDTO);

        String prid=rlentity.getPr_no().substring(rlentity.getPr_no().indexOf("/")+1);
        //修改申请单状态
        Pr prentity= this.prService.getAssoVo(prid).getEntity();
        prentity.setPstute("3");//已申请/审核不通过
        prentity=this.prService.save(prentity,false,true);
        PrDTO prDTO= new PrDTO();
        BeanUtils.copyProperties(prentity,prDTO);

        return this.buildSuccess();
    }

    /**
     * 主子表合并处理--主表单条查询
     * @return GenericAssoVo ,entity中保存的是单条主表数据,sublist中保存的是字表数据,一次性全部加载
     */
    @RequestMapping(value = "/getAssoVo" , method = RequestMethod.GET)
    @ResponseBody
    public Object  getAssoVo(@RequestParam(value = "id")   Serializable  id){
        if (null==id){ return buildSuccess();}
        GenericAssoVo<Rl> vo = service.getAssoVo( id);
        JsonResponse result = this.buildSuccess("entity",vo.getEntity());//保证入参出参结构一致
        result.getDetailMsg().putAll(vo.getSublist());
        return  result;
    }
    /**
     * 主子表合并处理--主表单条保存
     * @param vo GenericAssoVo ,entity中保存的是单条主表数据,sublist中保存的是子表数据
     * @return 主表的业务实体
     */
    @RequestMapping(value = "/saveAssoVo", method = RequestMethod.POST)
    @ResponseBody
    public Object  saveAssoVo(@RequestBody GenericAssoVo<Rl> vo){
        Associative annotation= vo.getEntity().getClass().getAnnotation(Associative.class);
        if (annotation == null || StringUtils.isEmpty(annotation.fkName())) {
            return buildError("", "No entity got @Associative nor fkName", RequestStatusEnum.FAIL_FIELD);
        }
        Object result =service.saveAssoVo(vo);
        return this.buildSuccess(result) ;
    }

    /**
     * 主子表合并处理--主表单条删除,若取消级联删除请在主实体上注解改为@Associative(fkName = "NA",deleteCascade = false)
     * @param entities 待删除业务实体
     * @return 删除成功的实体
     */
    @RequestMapping(value = "/deleAssoVo", method = RequestMethod.POST)
    @ResponseBody
    public Object  deleAssoVo(@RequestBody Rl... entities){
        if (entities.length==0){
            return this.buildGlobalError("deleting entity must not be empty");
        }
        Associative annotation = entities[0].getClass().getAnnotation(Associative.class);
        if (annotation != null && !StringUtils.isEmpty(annotation.fkName())) {
            int result =0;
            for (Rl entity:entities){
                if (StringUtils.isEmpty(entity.getId())) {
                    return this.buildError("ID", "ID field is empty:"+entity.toString(), RequestStatusEnum.FAIL_FIELD);
                } else {
                    result += this.service.deleAssoVo(entity);
                }
            }
            return this.buildSuccess(result + " rows(entity and its subEntities) has been deleted!");
        } else {
            return this.buildError("", "Nothing got @Associative nor fkName", RequestStatusEnum.FAIL_FIELD);
        }
    }

    /**
    * 单条添加
    * @param entity 业务实体
    * @return 标准JsonResponse结构
    */
    @RequestMapping(value = "/insertSelective", method = {RequestMethod.POST,RequestMethod.PATCH})
    @ResponseBody
    public Object insertSelective(@RequestBody Rl entity) {
            entity = this.service.save(entity,true,true);
            RlDTO dto = new RlDTO();
        try {
            BeanUtils.copyProperties(entity,dto);
            return this.buildSuccess(dto);
        }catch(Exception exp) {
            return this.buildError("msg", exp.getMessage(), RequestStatusEnum.FAIL_FIELD);
        }
    }


    /**
    * 单条修改
    * @param entity 业务实体
    * @return 标准JsonResponse结构
    */
    @RequestMapping(value = "/updateSelective", method = {RequestMethod.POST,RequestMethod.PATCH})
    @ResponseBody
    public Object updateSelective(@RequestBody Rl entity) {
                        entity = this.service.save(entity,false,true);
            RlDTO dto = new RlDTO();
        try {
            BeanUtils.copyProperties(entity,dto);
            return this.buildSuccess(dto);
        }catch(Exception exp) {
            return this.buildError("msg", exp.getMessage(), RequestStatusEnum.FAIL_FIELD);
        }
    }


    /**
    * 批量删除
    * @param listData 业务实体列表
    * @return 标准JsonResponse结构
    * @throws Exception
    */
    @RequestMapping(value = "/deleteBatch", method = RequestMethod.POST)
    @ResponseBody
    public Object deleteBatch(@RequestBody List<Rl> listData) throws Exception {

        this.service.deleteBatch(listData);
        return super.buildSuccess();
    }
}

