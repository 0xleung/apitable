import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { IField } from '@apitable/core';
import { IFieldValue } from 'interfaces';
import { isNumber } from 'lodash';
import { BaseNumberField } from 'modules/services/fusion/field/base.number.field';
import { FieldManager } from '../field.manager';

@Injectable()
export class RatingField extends BaseNumberField implements OnApplicationBootstrap {
  validate(fieldValue: IFieldValue, field: IField, extra?: { [key: string]: string }) {
    if (fieldValue === null) return;
    if (!isNumber(fieldValue) || Number.isNaN(fieldValue)) {
      this.throwException(field, 'api_param_rating_field_type_error', extra);
    }
    // 判断是不是超过最大值
    if (fieldValue > field.property.max) {
      this.throwException(field, 'api_params_rating_field_max_error');
    }
    if (fieldValue < 0) {
      this.throwException(field, 'api_param_invalid_rating_field');
    }
  }

  onApplicationBootstrap() {
    FieldManager.setService(RatingField.name, this);
  }
}
