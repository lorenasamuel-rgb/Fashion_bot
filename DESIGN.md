---
name: FleekFlow
description: Apple registration sheet for a Fleek wholesale lot, filled only by what the supplier said.
colors:
  fleek-yellow: "#F8C040"
  fleek-yellow-press: "#E0AA2E"
  fleek-green: "#178A56"
  fleek-green-tint: "#E7F6EE"
  ink: "#1D1D1F"
  secondary: "#6E6E73"
  disabled-label: "#3A3A3E"
  canvas: "#F2F2F7"
  card: "#FFFFFF"
  fill: "#F4F5F7"
  line: "#D2D2D7"
  disabled: "#E8E8ED"
typography:
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Helvetica Neue, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Helvetica Neue, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Helvetica Neue, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
rounded:
  field: "12px"
  phone: "44px"
  bubble: "18px"
spacing:
  field: "20px"
  screen: "16px"
components:
  button-primary:
    backgroundColor: "{colors.fleek-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0 16px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.fleek-yellow-press}"
    textColor: "{colors.ink}"
  button-primary-disabled:
    backgroundColor: "{colors.disabled}"
    textColor: "{colors.disabled-label}"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    rounded: "999px"
    padding: "4px 12px"
  audience-selected:
    backgroundColor: "{colors.fleek-green-tint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
---

## Overview

FleekFlow’s supplier surface is Fleek’s product-registration sheet, drawn with Apple’s interface grammar. The phone holds the listing. The Wassist thread beside it is how the fields get their values. Grade, shipping, and duties stay unknown until the supplier states them.

## Colors

Fleek yellow `#F8C040` is the only primary action color, sampled from the Fleek upload button. Selection green `#178A56` marks the chosen audience. Black pills mark a stated category or brand. The desk behind the phone is iOS grouped gray `#F2F2F7`. The sheet itself is white.

## Typography

The face is the Apple system stack, SF Pro on Apple devices. The screen title is 28px bold. Fields are 17px. Labels are 13px semibold. Tracking stays slightly tight, never wide.

## Layout

On a wide screen the phone and the message thread sit side by side. On a narrow screen the sheet comes first, at about 62% of the viewport, and the thread follows. Four steps: details, grade and size, inventory and price, shipping. Progress is four Fleek-yellow dots.

## Elevation & Depth

The phone and the thread each carry one soft shadow, offset down, blur about 50px, black at 16% opacity. Fields are flat, separated by a 1px `#D2D2D7` border.

## Shapes

Fields, the back control, and the primary button use a 12px radius. Message bubbles use 18px. The desktop phone bezel uses 44px. Selected brands are full pills.

## Components

The primary button is Fleek yellow with black text. It is gray until the listing can be confirmed. Audience choices are four equal tiles; the stated one gets a 2px green border and a green tint. Stated category and brand render as black pills inside the select row. Grade options stay unselected. The shipping table shows the unit price as base and leaves shipping and total blank until stated.

## Do's and Don'ts

Do keep a field empty when the supplier has not said it. Do use Fleek yellow only for the action that moves the listing forward. Do not assign a grade, invent a shipping rate, or mark the supplier as verified.
