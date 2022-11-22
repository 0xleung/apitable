package com.vikadata.api.util.billing;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import cn.hutool.core.map.MapUtil;
import cn.hutool.core.util.ArrayUtil;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

import com.vikadata.api.enterprise.billing.util.BillingConfigManager;
import com.vikadata.api.enterprise.billing.util.model.BillingPlanFeature;
import com.vikadata.api.enterprise.billing.util.model.ProductChannel;
import com.vikadata.api.enterprise.billing.util.model.ProductEnum;
import com.vikadata.system.config.billing.Event;
import com.vikadata.system.config.billing.Plan;
import com.vikadata.system.config.billing.Price;
import com.vikadata.system.config.billing.PriceList;
import com.vikadata.system.config.billing.Product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.util.Arrays.array;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;


public class BillingConfigManagerTest {

    /**
     * Product Channel - Proprietary Cloud Billing: Flagship Product
     */
    @Test
    public void testGetFreeProductByPrivateChannel() {
        Product privateFreeProduct = BillingConfigManager.getCurrentFreeProduct(ProductChannel.PRIVATE);
        assertNotNull(privateFreeProduct);
        assertEquals(privateFreeProduct.getId(), ProductEnum.PRIVATE_CLOUD.getName());
        Map<String, Plan> planMap = MapUtil.getAny(BillingConfigManager.getBillingConfig().getPlans(), ArrayUtil.toArray(privateFreeProduct.getPlans(), String.class));
        Assertions.assertThat(planMap).isNotEmpty().hasSize(1);
        Plan freePlan = planMap.get(planMap.keySet().stream().findFirst().get());
        BillingPlanFeature planFeature = BillingConfigManager.buildPlanFeature(freePlan, Collections.emptyList());
        Assertions.assertThat(planFeature.getMaxSeats()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxSheetNums()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxApiCall()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxGanttViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxCalendarViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxFormViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxCapacitySizeInBytes()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxAdminNums()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxGalleryViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getNodePermissionNums()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getFieldPermissionNums()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxKanbanViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxRemainTimeMachineDays()).isEqualTo(730);
        Assertions.assertThat(planFeature.getMaxRemainTrashDays()).isEqualTo(730);
        Assertions.assertThat(planFeature.getMaxRowsInSpace()).isEqualTo(500000000);
        Assertions.assertThat(planFeature.getMaxRowsPerSheet()).isEqualTo(50000);
        Assertions.assertThat(planFeature.getIntegrationDingtalk()).isTrue();
        Assertions.assertThat(planFeature.getIntegrationFeishu()).isTrue();
        Assertions.assertThat(planFeature.getIntegrationWeCom()).isTrue();
        Assertions.assertThat(planFeature.getIntegrationOfficePreview()).isTrue();
        Assertions.assertThat(planFeature.getRainbowLabel()).isTrue();
        Assertions.assertThat(planFeature.getWatermark()).isTrue();
    }

    /**
     * Product Channels - Alibaba Cloud Computing Nest Billing: Free Products
     */
    @Test
    public void testGetFreeProductByAliyunChannel() {
        Product privateFreeProduct = BillingConfigManager.getCurrentFreeProduct(ProductChannel.ALIYUN);
        assertNotNull(privateFreeProduct);
        assertEquals(privateFreeProduct.getId(), ProductEnum.ATLAS.getName());
        Map<String, Plan> planMap = MapUtil.getAny(BillingConfigManager.getBillingConfig().getPlans(), ArrayUtil.toArray(privateFreeProduct.getPlans(), String.class));
        Assertions.assertThat(planMap).isNotEmpty().hasSize(1);
        Plan freePlan = planMap.get(planMap.keySet().stream().findFirst().get());
        BillingPlanFeature planFeature = BillingConfigManager.buildPlanFeature(freePlan, Collections.emptyList());
        Assertions.assertThat(planFeature.getMaxSeats()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxSheetNums()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxApiCall()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxGanttViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxCalendarViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxFormViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxCapacitySizeInBytes()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxAdminNums()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxGalleryViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getNodePermissionNums()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getFieldPermissionNums()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxKanbanViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxRemainTimeMachineDays()).isEqualTo(730);
        Assertions.assertThat(planFeature.getMaxRemainTrashDays()).isEqualTo(730);
        Assertions.assertThat(planFeature.getMaxRowsInSpace()).isEqualTo(20000000);
        Assertions.assertThat(planFeature.getMaxRowsPerSheet()).isEqualTo(50000);
        Assertions.assertThat(planFeature.getIntegrationDingtalk()).isFalse();
        Assertions.assertThat(planFeature.getIntegrationFeishu()).isFalse();
        Assertions.assertThat(planFeature.getIntegrationWeCom()).isFalse();
        Assertions.assertThat(planFeature.getIntegrationOfficePreview()).isTrue();
        Assertions.assertThat(planFeature.getRainbowLabel()).isTrue();
        Assertions.assertThat(planFeature.getWatermark()).isFalse();
    }

    /**
     * Product channel - self-operated billing: bronze-level product
     */
    @Test
    public void testGetFreeProductByVikaChannel() {
        Product freeProduct = BillingConfigManager.getCurrentFreeProduct(ProductChannel.VIKA);
        assertNotNull(freeProduct);
        assertEquals(freeProduct.getId(), ProductEnum.BRONZE.getName());
        Map<String, Plan> planMap = MapUtil.getAny(BillingConfigManager.getBillingConfig().getPlans(), ArrayUtil.toArray(freeProduct.getPlans(), String.class));
        Assertions.assertThat(planMap).isNotEmpty().hasSize(1);
        Plan freePlan = planMap.get(planMap.keySet().stream().findFirst().get());
        BillingPlanFeature planFeature = BillingConfigManager.buildPlanFeature(freePlan, Collections.emptyList());
        Assertions.assertThat(planFeature.getMaxSeats()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxSheetNums()).isEqualTo(30);
        Assertions.assertThat(planFeature.getMaxApiCall()).isEqualTo(10000);
        Assertions.assertThat(planFeature.getMaxGanttViewsInSpace()).isEqualTo(10);
        Assertions.assertThat(planFeature.getMaxCalendarViewsInSpace()).isEqualTo(5);
        Assertions.assertThat(planFeature.getMaxFormViewsInSpace()).isEqualTo(20);
        Assertions.assertThat(planFeature.getMaxCapacitySizeInBytes()).isEqualTo(1024 * 1024 * 1024);
        Assertions.assertThat(planFeature.getMaxAdminNums()).isEqualTo(3);
        Assertions.assertThat(planFeature.getMaxGalleryViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getNodePermissionNums()).isEqualTo(10);
        Assertions.assertThat(planFeature.getFieldPermissionNums()).isEqualTo(10);
        Assertions.assertThat(planFeature.getMaxKanbanViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxRemainTimeMachineDays()).isEqualTo(14);
        Assertions.assertThat(planFeature.getMaxRemainTrashDays()).isEqualTo(14);
        Assertions.assertThat(planFeature.getMaxRowsInSpace()).isEqualTo(20000);
        Assertions.assertThat(planFeature.getMaxRowsPerSheet()).isEqualTo(5000);
        Assertions.assertThat(planFeature.getIntegrationDingtalk()).isFalse();
        Assertions.assertThat(planFeature.getIntegrationFeishu()).isFalse();
        Assertions.assertThat(planFeature.getIntegrationWeCom()).isFalse();
        Assertions.assertThat(planFeature.getIntegrationOfficePreview()).isTrue();
        Assertions.assertThat(planFeature.getRainbowLabel()).isFalse();
        Assertions.assertThat(planFeature.getWatermark()).isFalse();
    }

    @Test
    public void testSilverProductPlanFeture() {
        Plan silverPlan = BillingConfigManager.getPlan(ProductEnum.SILVER, 10);
        Plan addOnPlan = BillingConfigManager.getBillingConfig().getPlans().get("capacity_300_MB");
        BillingPlanFeature planFeature = BillingConfigManager.buildPlanFeature(silverPlan, Collections.singletonList(addOnPlan));
        Assertions.assertThat(planFeature.getMaxSeats()).isEqualTo(10);
        Assertions.assertThat(planFeature.getMaxSheetNums()).isEqualTo(300);
        Assertions.assertThat(planFeature.getMaxApiCall()).isEqualTo(100000);
        Assertions.assertThat(planFeature.getMaxGanttViewsInSpace()).isEqualTo(50);
        Assertions.assertThat(planFeature.getMaxCalendarViewsInSpace()).isEqualTo(50);
        Assertions.assertThat(planFeature.getMaxFormViewsInSpace()).isEqualTo(100);
        Assertions.assertThat(planFeature.getMaxCapacitySizeInBytes()).isEqualTo((50 * 1024 * 1024 * 1024L) + (300 * 1024 * 1024L));
        Assertions.assertThat(planFeature.getMaxAdminNums()).isEqualTo(5);
        Assertions.assertThat(planFeature.getMaxGalleryViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getNodePermissionNums()).isEqualTo(50);
        Assertions.assertThat(planFeature.getFieldPermissionNums()).isEqualTo(50);
        Assertions.assertThat(planFeature.getMaxKanbanViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxRemainTimeMachineDays()).isEqualTo(90);
        Assertions.assertThat(planFeature.getMaxRemainTrashDays()).isEqualTo(90);
        Assertions.assertThat(planFeature.getMaxRowsInSpace()).isEqualTo(3000000);
        Assertions.assertThat(planFeature.getMaxRowsPerSheet()).isEqualTo(10000);
        Assertions.assertThat(planFeature.getIntegrationDingtalk()).isFalse();
        Assertions.assertThat(planFeature.getIntegrationFeishu()).isFalse();
        Assertions.assertThat(planFeature.getIntegrationWeCom()).isFalse();
        Assertions.assertThat(planFeature.getIntegrationOfficePreview()).isTrue();
        Assertions.assertThat(planFeature.getRainbowLabel()).isTrue();
        Assertions.assertThat(planFeature.getWatermark()).isFalse();
    }

    /**
     * Product Channel - DingTalk Billing: DingTalk Basic Edition Products
     */
    @Test
    public void testGetFreeProductByDingtalkChannel() {
        Product freeProduct = BillingConfigManager.getCurrentFreeProduct(ProductChannel.DINGTALK);
        assertThat(freeProduct).isNotNull();
        assertThat(ProductEnum.DINGTALK_BASE.getName()).isEqualTo(freeProduct.getId());
        Map<String, Plan> planMap = MapUtil.getAny(BillingConfigManager.getBillingConfig().getPlans(), ArrayUtil.toArray(freeProduct.getPlans(), String.class));
        Assertions.assertThat(planMap).isNotEmpty().hasSize(1);
        Plan freePlan = planMap.get(planMap.keySet().stream().findFirst().get());
        BillingPlanFeature planFeature = BillingConfigManager.buildPlanFeature(freePlan, Collections.emptyList());
        Assertions.assertThat(planFeature.getMaxSeats()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxSheetNums()).isEqualTo(30);
        Assertions.assertThat(planFeature.getMaxApiCall()).isEqualTo(10000);
        Assertions.assertThat(planFeature.getMaxGanttViewsInSpace()).isEqualTo(10);
        Assertions.assertThat(planFeature.getMaxCalendarViewsInSpace()).isEqualTo(5);
        Assertions.assertThat(planFeature.getMaxFormViewsInSpace()).isEqualTo(20);
        Assertions.assertThat(planFeature.getMaxCapacitySizeInBytes()).isEqualTo(1024 * 1024 * 1024);
        Assertions.assertThat(planFeature.getMaxAdminNums()).isEqualTo(3);
        Assertions.assertThat(planFeature.getMaxGalleryViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getNodePermissionNums()).isEqualTo(10);
        Assertions.assertThat(planFeature.getFieldPermissionNums()).isEqualTo(10);
        Assertions.assertThat(planFeature.getMaxKanbanViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxRemainTimeMachineDays()).isEqualTo(14);
        Assertions.assertThat(planFeature.getMaxRemainTrashDays()).isEqualTo(14);
        Assertions.assertThat(planFeature.getMaxRowsInSpace()).isEqualTo(20000);
        Assertions.assertThat(planFeature.getMaxRowsPerSheet()).isEqualTo(5000);
        Assertions.assertThat(planFeature.getIntegrationDingtalk()).isTrue();
        Assertions.assertThat(planFeature.getIntegrationFeishu()).isFalse();
        Assertions.assertThat(planFeature.getIntegrationWeCom()).isFalse();
        Assertions.assertThat(planFeature.getIntegrationOfficePreview()).isTrue();
        Assertions.assertThat(planFeature.getRainbowLabel()).isFalse();
        Assertions.assertThat(planFeature.getWatermark()).isFalse();
    }

    /**
     * Product Channels - Feishu Billing: Feishu Basic Edition Products
     */
    @Test
    public void testGetFreeProductByFeishuChannel() {
        Product freeProduct = BillingConfigManager.getCurrentFreeProduct(ProductChannel.LARK);
        assertNotNull(freeProduct);
        assertEquals(freeProduct.getId(), ProductEnum.FEISHU_BASE.getName());
        Map<String, Plan> planMap = MapUtil.getAny(BillingConfigManager.getBillingConfig().getPlans(), ArrayUtil.toArray(freeProduct.getPlans(), String.class));
        Assertions.assertThat(planMap).isNotEmpty().hasSize(1);
        Plan freePlan = planMap.get(planMap.keySet().stream().findFirst().get());
        BillingPlanFeature planFeature = BillingConfigManager.buildPlanFeature(freePlan, Collections.emptyList());
        Assertions.assertThat(planFeature.getMaxSeats()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxSheetNums()).isEqualTo(30);
        Assertions.assertThat(planFeature.getMaxApiCall()).isEqualTo(10000);
        Assertions.assertThat(planFeature.getMaxGanttViewsInSpace()).isEqualTo(10);
        Assertions.assertThat(planFeature.getMaxCalendarViewsInSpace()).isEqualTo(5);
        Assertions.assertThat(planFeature.getMaxFormViewsInSpace()).isEqualTo(20);
        Assertions.assertThat(planFeature.getMaxCapacitySizeInBytes()).isEqualTo(1024 * 1024 * 1024);
        Assertions.assertThat(planFeature.getMaxAdminNums()).isEqualTo(3);
        Assertions.assertThat(planFeature.getMaxGalleryViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getNodePermissionNums()).isEqualTo(10);
        Assertions.assertThat(planFeature.getFieldPermissionNums()).isEqualTo(10);
        Assertions.assertThat(planFeature.getMaxKanbanViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxRemainTimeMachineDays()).isEqualTo(14);
        Assertions.assertThat(planFeature.getMaxRemainTrashDays()).isEqualTo(14);
        Assertions.assertThat(planFeature.getMaxRowsInSpace()).isEqualTo(20000);
        Assertions.assertThat(planFeature.getMaxRowsPerSheet()).isEqualTo(5000);
        Assertions.assertThat(planFeature.getIntegrationDingtalk()).isFalse();
        Assertions.assertThat(planFeature.getIntegrationFeishu()).isTrue();
        Assertions.assertThat(planFeature.getIntegrationWeCom()).isFalse();
        Assertions.assertThat(planFeature.getIntegrationOfficePreview()).isTrue();
        Assertions.assertThat(planFeature.getRainbowLabel()).isFalse();
        Assertions.assertThat(planFeature.getWatermark()).isFalse();
    }

    /**
     * Product Channel-Enterprise WeChat Billing: Enterprise WeChat Basic Edition Products
     */
    @Test
    public void testGetFreeProductByWecomChannel() {
        Product freeProduct = BillingConfigManager.getCurrentFreeProduct(ProductChannel.WECOM);
        assertNotNull(freeProduct);
        assertEquals(freeProduct.getId(), ProductEnum.WECOM_BASE.getName());
        Map<String, Plan> planMap = MapUtil.getAny(BillingConfigManager.getBillingConfig().getPlans(), ArrayUtil.toArray(freeProduct.getPlans(), String.class));
        Assertions.assertThat(planMap).isNotEmpty().hasSize(1);
        Plan freePlan = planMap.get(planMap.keySet().stream().findFirst().get());
        BillingPlanFeature planFeature = BillingConfigManager.buildPlanFeature(freePlan, Collections.emptyList());
        Assertions.assertThat(planFeature.getMaxSeats()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxSheetNums()).isEqualTo(30);
        Assertions.assertThat(planFeature.getMaxApiCall()).isEqualTo(10000);
        Assertions.assertThat(planFeature.getMaxGanttViewsInSpace()).isEqualTo(10);
        Assertions.assertThat(planFeature.getMaxCalendarViewsInSpace()).isEqualTo(5);
        Assertions.assertThat(planFeature.getMaxFormViewsInSpace()).isEqualTo(20);
        Assertions.assertThat(planFeature.getMaxCapacitySizeInBytes()).isEqualTo(1024 * 1024 * 1024);
        Assertions.assertThat(planFeature.getMaxAdminNums()).isEqualTo(3);
        Assertions.assertThat(planFeature.getMaxGalleryViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getNodePermissionNums()).isEqualTo(10);
        Assertions.assertThat(planFeature.getFieldPermissionNums()).isEqualTo(10);
        Assertions.assertThat(planFeature.getMaxKanbanViewsInSpace()).isEqualTo(-1);
        Assertions.assertThat(planFeature.getMaxRemainTimeMachineDays()).isEqualTo(14);
        Assertions.assertThat(planFeature.getMaxRemainTrashDays()).isEqualTo(14);
        Assertions.assertThat(planFeature.getMaxRowsInSpace()).isEqualTo(20000);
        Assertions.assertThat(planFeature.getMaxRowsPerSheet()).isEqualTo(5000);
        Assertions.assertThat(planFeature.getIntegrationDingtalk()).isFalse();
        Assertions.assertThat(planFeature.getIntegrationFeishu()).isFalse();
        Assertions.assertThat(planFeature.getIntegrationWeCom()).isTrue();
        Assertions.assertThat(planFeature.getIntegrationOfficePreview()).isTrue();
        Assertions.assertThat(planFeature.getRainbowLabel()).isFalse();
        Assertions.assertThat(planFeature.getWatermark()).isFalse();
    }

    @Test
    public void testGetFreePlanByChannel() {
        // Sass: Bronze Edition
        Plan bronzePlan = BillingConfigManager.getFreePlan(ProductChannel.VIKA);
        assertNotNull(bronzePlan);
        assertTrue(bronzePlan.isOnline());
        assertEquals(bronzePlan.getProduct(), ProductEnum.BRONZE.getName());
        //DingTalk Billing: DingTalk Basic Edition
        Plan dingtalkBasePlan = BillingConfigManager.getFreePlan(ProductChannel.DINGTALK);
        assertNotNull(dingtalkBasePlan);
        assertTrue(dingtalkBasePlan.isOnline());
        assertEquals(dingtalkBasePlan.getProduct(), ProductEnum.DINGTALK_BASE.getName());
        // Feishu Billing: Feishu Basic Edition
        Plan feishuBasePlan = BillingConfigManager.getFreePlan(ProductChannel.LARK);
        assertNotNull(feishuBasePlan);
        assertTrue(feishuBasePlan.isOnline());
        assertEquals(feishuBasePlan.getProduct(), ProductEnum.FEISHU_BASE.getName());
        // Enterprise WeChat Billing: Enterprise WeChat Basic Edition
        Plan wecomBasePlan = BillingConfigManager.getFreePlan(ProductChannel.WECOM);
        assertNotNull(wecomBasePlan);
        assertTrue(wecomBasePlan.isOnline());
        assertEquals(wecomBasePlan.getProduct(), ProductEnum.WECOM_BASE.getName());
        // Proprietary Cloud Billing: Proprietary Cloud Ultimate
        Plan privateCloudPlan = BillingConfigManager.getFreePlan(ProductChannel.PRIVATE);
        assertNotNull(privateCloudPlan);
        assertEquals(privateCloudPlan.getProduct(), ProductEnum.PRIVATE_CLOUD.getName());
    }

    @Test
    public void testGetPriceBySeatAndMonth() {
        Price price = BillingConfigManager.getPriceBySeatAndMonths(ProductEnum.SILVER, 100, 1);
        assertNotNull(price);
        assertEquals(price.getSeat(), 100);
        assertEquals(price.getMonth(), 1);
    }

    @Test
    public void testSilverPriceList() {
        List<Price> priceList = BillingConfigManager.getPriceList(ProductEnum.SILVER);
        // What plans are must-haves for the silver package
        Integer[] months = array(1, 6, 12);
        Integer[] seats = array(2, 100);
        assertEquals(priceList.size(), months.length * seats.length);
    }

    @Test
    public void testGoldPriceList() {
        List<Price> priceList = BillingConfigManager.getPriceList(ProductEnum.GOLD);
        // What plans are must-haves for the silver package
        Integer[] months = array(1, 6, 12);
        Integer[] seats = array(200);
        assertEquals(priceList.size(), months.length * seats.length);
    }

    @Test
    public void testEventConfigIsNotNull() {
        Map<String, Event> eventConfig = BillingConfigManager.getBillingConfig().getEvents();
        assertNotNull(eventConfig);
    }

    @Test
    public void testPriceListConfigIsNotNull() {
        Map<String, PriceList> priceListConfig = BillingConfigManager.getBillingConfig().getPricelist();
        assertNotNull(priceListConfig);
    }

    @Test
    public void testGetEventOnEffectiveDate() {
        assertThat(BillingConfigManager.getEventOnEffectiveDate(LocalDate.of(2022, 10, 23))).isNull();
        assertThat(BillingConfigManager.getEventOnEffectiveDate(LocalDate.of(2022, 10, 24))).isNotNull();
        assertThat(BillingConfigManager.getEventOnEffectiveDate(LocalDate.of(2022, 11, 11))).isNotNull();
        assertThat(BillingConfigManager.getEventOnEffectiveDate(LocalDate.of(2022, 11, 12))).isNull();
    }
}
