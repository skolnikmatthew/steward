import React from 'react';
import Svg, {
  Circle,
  Path,
  Rect,
  Line,
  Polygon,
  G,
} from 'react-native-svg';
import { colors } from '../theme';

type Props = {
  category: string;
  size: number;
  selected?: boolean;
};

// All icon paths drawn on a 24×24 coordinate space.
// The parent <G> handles translation + scale into the stamp's inner ring.
function CategoryIcon({
  category,
  color,
  strokeWidth,
}: {
  category: string;
  color: string;
  strokeWidth: number;
}) {
  const stroke = { stroke: color, fill: 'none', strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const solid = { fill: color, stroke: 'none' };

  switch (category) {
    case 'food':
      return (
        <G>
          {/* Fork: three tines + merged handle */}
          <Path {...stroke} d="M8 4v5M8 4L6 7M8 4L10 7M6 7Q6 10 8 10Q10 10 10 7M8 10v10" />
          {/* Knife: curved blade then handle */}
          <Path {...stroke} d="M16 4C18 4 18 9 16 10v10" />
        </G>
      );

    case 'transport':
      return (
        <G>
          <Rect {...stroke} x={2} y={9} width={20} height={7} rx={2} />
          <Path {...stroke} d="M5 9L7 5H17L19 9" />
          <Circle {...solid} cx={7} cy={16} r={2.5} />
          <Circle {...solid} cx={17} cy={16} r={2.5} />
        </G>
      );

    case 'housing':
      return (
        <G>
          {/* Roof */}
          <Polygon {...stroke} points="12,3 22,12 2,12" />
          {/* Walls */}
          <Rect {...stroke} x={4} y={12} width={16} height={9} />
          {/* Door */}
          <Rect {...solid} x={9} y={15} width={6} height={6} />
        </G>
      );

    case 'shopping':
      return (
        <G>
          {/* Bag body */}
          <Path {...stroke} d="M5 8H19L18 20H6Z" />
          {/* Handle arch */}
          <Path {...stroke} d="M9 8V6A3 3 0 0115 6V8" />
        </G>
      );

    case 'entertainment':
      return (
        <G>
          {/* 5-pointed star */}
          <Polygon
            {...stroke}
            fill={color}
            points="12,2 14.35,8.76 20.56,9.22 15.80,13.24 17.29,19.28 12,16 6.71,19.28 8.20,13.24 3.44,9.22 9.65,8.76"
          />
        </G>
      );

    case 'health':
      return (
        <G>
          <Line {...stroke} x1={12} y1={4} x2={12} y2={20} />
          <Line {...stroke} x1={4} y1={12} x2={20} y2={12} />
        </G>
      );

    case 'travel':
      return (
        <G>
          {/* Paper plane body */}
          <Path {...stroke} fill={color} d="M22 2L15 22L11 13L2 9Z" />
          {/* Wing fold */}
          <Line {...stroke} x1={11} y1={13} x2={22} y2={2} />
        </G>
      );

    case 'other':
    default:
      return (
        <G>
          <Circle {...solid} cx={5}  cy={12} r={2} />
          <Circle {...solid} cx={12} cy={12} r={2} />
          <Circle {...solid} cx={19} cy={12} r={2} />
        </G>
      );
  }
}

export default function CategoryStamp({ category, size, selected = false }: Props) {
  const center   = size / 2;
  const outerR   = center - 1.5;
  const ringGap  = size >= 56 ? 5 : 3;
  const innerR   = outerR - ringGap;

  // Icon occupies ~70% of the inner ring diameter
  const iconDiameter = innerR * 1.4;
  const scale        = iconDiameter / 24;
  const iconOffset   = center - iconDiameter / 2;

  const inkColor    = selected ? colors.ink : colors.ink2;
  const fillColor   = selected ? colors.green : 'transparent';

  return (
    <Svg width={size} height={size}>
      {/* Outer ring fill */}
      <Circle
        cx={center}
        cy={center}
        r={outerR}
        fill={fillColor}
        stroke={inkColor}
        strokeWidth={selected ? 1.5 : 1}
      />
      {/* Inner ring */}
      <Circle
        cx={center}
        cy={center}
        r={innerR}
        fill="none"
        stroke={inkColor}
        strokeWidth={0.75}
      />
      {/* Icon */}
      <G transform={`translate(${iconOffset}, ${iconOffset}) scale(${scale})`}>
        <CategoryIcon
          category={category}
          color={inkColor}
          strokeWidth={1.5 / scale}
        />
      </G>
    </Svg>
  );
}
