/**
 * @vendor iCON
 * @device V1-M
 */

import { ChannelSurfaceElements, DeviceConfig } from ".";
import { JogWheel } from "/decorators/surface-elements/JogWheel";
import { LedButton } from "/decorators/surface-elements/LedButton";
import { LedPushEncoder } from "/decorators/surface-elements/LedPushEncoder";
import { TouchSensitiveMotorFader } from "/decorators/surface-elements/TouchSensitiveFader";
import { IconColorManager } from "/midi/managers/colors/IconColorManager";
import { createElements } from "/util";

const channelWidth = 3.5;
const channelElementsWidth = 8 * channelWidth;
const surfaceHeight = 38;
const deviceFramePaddingWidth = 0.8;

function makeChannelElements(surface: MR_DeviceSurface, x: number): ChannelSurfaceElements[] {
  // Secondary scribble strip frame
  surface.makeBlindPanel(x + deviceFramePaddingWidth, 20 - 0.25, channelElementsWidth, 2.5);

  return createElements(8, (index) => {
    const currentChannelXPosition = x + deviceFramePaddingWidth + index * channelWidth;

    const [recordButton, soloButton, muteButton, selectButton] = createElements(
      4,
      (row) =>
        new LedButton(surface, {
          position: [currentChannelXPosition + 1 - 0.125, 11.5 + row * 2 - 0.125, 1.75, 1.75],
          isChannelButton: true,
        }),
    );

    const encoder = new LedPushEncoder(surface, currentChannelXPosition + 0.75, 9.5, 2, 2);

    // VU meter
    surface.makeBlindPanel(currentChannelXPosition + 1.3, 1.25, 0.9, 2.5);

    // Primary scribble strip
    surface.makeBlindPanel(currentChannelXPosition, 4, channelWidth, 2.5);
    surface
      .makeLabelField(currentChannelXPosition + 0.25, 4.25, channelWidth - 0.5, 0.75)
      .relateTo(selectButton);
    surface
      .makeLabelField(currentChannelXPosition + 0.25, 4.25 + 0.75, channelWidth - 0.5, 0.75)
      .relateTo(encoder);

    // Secondary scribble strip
    surface.makeBlindPanel(currentChannelXPosition + 0.25, 20, channelWidth - 0.5, 2);
    surface
      .makeLabelField(currentChannelXPosition + 0.5, 20.25, channelWidth - 1, 0.75)
      .relateTo(selectButton);
    surface.makeLabelField(currentChannelXPosition + 0.5, 20.25 + 0.75, channelWidth - 1, 0.75);

    return {
      index,
      encoder,
      scribbleStrip: {
        trackTitle: surface.makeCustomValueVariable("scribbleStripTrackTitle"),
      },
      vuMeter: surface.makeCustomValueVariable("vuMeter"),
      buttons: {
        record: recordButton,
        solo: soloButton,
        mute: muteButton,
        select: selectButton,
      },

      fader: new TouchSensitiveMotorFader(surface, currentChannelXPosition + 1, 24.5, 1.5, 11),
    };
  });
}

export const deviceConfig: DeviceConfig = {
  colorManager: IconColorManager,
  maximumMeterValue: 0xc,
  hasIndividualScribbleStrips: true,
  hasSecondaryScribbleStrips: true,

  detectionUnits: [
    {
      main: (detectionPortPair) =>
        detectionPortPair
          .expectInputNameStartsWith("iCON V1-M")
          .expectOutputNameStartsWith("iCON V1-M"),
      extender: (detectionPortPair) =>
        detectionPortPair
          .expectInputNameStartsWith("iCON V1-X1")
          .expectOutputNameStartsWith("iCON V1-X1"),
    },
  ],

  createExtenderSurface(surface, x) {
    const surfaceWidth = channelElementsWidth + deviceFramePaddingWidth * 2;

    // Device frame
    surface.makeBlindPanel(x, 0, surfaceWidth, surfaceHeight);

    return {
      width: surfaceWidth,
      channelElements: makeChannelElements(surface, x),
    };
  },

  createMainSurface(surface, x) {
    const surfaceWidth = channelElementsWidth + 19;

    // Device frame
    surface.makeBlindPanel(x, 0, surfaceWidth, surfaceHeight);

    const channelElements = makeChannelElements(surface, x);
    x += deviceFramePaddingWidth + channelElementsWidth;

    // Main VU meters
    surface.makeBlindPanel(x + 1.3, 1.25, 0.9, 2.5);
    surface.makeBlindPanel(x + 2.3, 1.25, 0.9, 2.5);

    // Time display
    surface.makeBlindPanel(x + 4.75, 4.75, 10.25, 1.5);

    // DAW and Function Layer buttons
    createElements(8, (buttonIndex) => {
      surface
        .makeBlindPanel(x + 2 + buttonIndex * 1.65 + +(buttonIndex > 2) * 0.75, 9.125, 1.5, 1.5)
        .setShapeCircle();
    });

    // Button matrix
    const buttonMatrixControlLayerZone = surface.makeControlLayerZone("Touch Buttons");
    const buttonMatrix = createElements(5, (layerIndex) => {
      const controlLayer = buttonMatrixControlLayerZone.makeControlLayer(
        "Layer " + (layerIndex < 3 ? layerIndex + 1 : "U" + (layerIndex - 3)),
      );

      return createElements(4, (row) =>
        createElements(6, (column) =>
          new LedButton(surface, {
            position: [x + 1.25 + column * 2.5, 12.25 + row * 2, 2.5, 2],
          }).setControlLayer(controlLayer),
        ),
      );
    });

    const lowerButtonMatrix = createElements(2, (row) =>
      createElements(
        6,
        (column) =>
          new LedButton(surface, {
            position: [x + 3.5 + column * 2.25, 22.75 + row * 1.75, 2.125, 1.5],
          }),
      ),
    );

    const transportButtons: LedButton[] = [];
    let nextTransportButtonXPosition = x + 3.5;
    for (const buttonWidth of [1.575, 1.575, 1.575, 2.005, 3.01, 3.01]) {
      transportButtons.push(
        new LedButton(surface, {
          position: [nextTransportButtonXPosition, 22.75 + 2 * 1.75, buttonWidth, 1.5],
        }),
      );
      nextTransportButtonXPosition += buttonWidth + 0.125;
    }

    return {
      width: surfaceWidth,
      channelElements,
      controlSectionElements: {
        mainFader: new TouchSensitiveMotorFader(surface, x + 1, 24.5, 1.5, 11),
        mainVuMeters: {
          left: surface.makeCustomValueVariable("Main VU Meter L"),
          right: surface.makeCustomValueVariable("Main VU Meter R"),
        },

        jogWheel: new JogWheel(surface, x + 6.675, 29, 7, 7),

        buttons: {
          navigation: {
            channel: { left: lowerButtonMatrix[0][0], right: lowerButtonMatrix[0][1] },
            bank: { left: lowerButtonMatrix[0][2], right: lowerButtonMatrix[0][3] },
          },
          flip: lowerButtonMatrix[0][4],

          automation: {
            read: lowerButtonMatrix[1][1],
            write: lowerButtonMatrix[1][3],
          },

          transport: {
            rewind: transportButtons[0],
            forward: transportButtons[1],
            cycle: transportButtons[2],
            stop: transportButtons[3],
            play: transportButtons[4],
            record: transportButtons[5],
          },
        },

        // footSwitch1: surface.makeButton(x + 22.1, 3.5, 1.5, 1.5).setShapeCircle(),
        // footSwitch2: surface.makeButton(x + 22.1 + 2, 3.5, 1.5, 1.5).setShapeCircle(),
      },
    };
  },
};