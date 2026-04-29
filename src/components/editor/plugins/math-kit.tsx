'use client';

import { EquationPlugin, InlineEquationPlugin } from '@platejs/math/react';

import {
  EquationElement,
  InlineEquationElement,
} from '@/components/ui/equation-node';

/* @platejs/math v52 没有 MathRules，升级到 v53 后可恢复 inputRules 配置 */
export const MathKit = [
  InlineEquationPlugin.withComponent(InlineEquationElement),
  EquationPlugin.withComponent(EquationElement),
];
