/**
 * Simulation Scenario Library — 10 realistic founder scenarios (V1).
 */

import { deflateSync } from 'node:zlib';
import type { FounderSimulationScenario } from './founder-simulation-types.js';

export function buildTranscriptWav(transcript: string, sampleRate = 16000, seconds = 2): Buffer {
  const dataSize = sampleRate * seconds * 2;
  const trnBytes = Buffer.from(transcript, 'utf8');
  const trnChunk = Buffer.alloc(8 + trnBytes.length);
  trnChunk.write('trn ', 0, 4, 'ascii');
  trnChunk.writeUInt32LE(trnBytes.length, 4);
  trnBytes.copy(trnChunk, 8);
  const fmt = Buffer.alloc(24);
  fmt.write('fmt ', 0, 4, 'ascii');
  fmt.writeUInt32LE(16, 4);
  fmt.writeUInt16LE(1, 8);
  fmt.writeUInt16LE(1, 10);
  fmt.writeUInt32LE(sampleRate, 12);
  fmt.writeUInt32LE(sampleRate * 2, 16);
  fmt.writeUInt16LE(2, 20);
  fmt.writeUInt16LE(16, 22);
  const data = Buffer.alloc(8 + dataSize);
  data.write('data', 0, 4, 'ascii');
  data.writeUInt32LE(dataSize, 4);
  const header = Buffer.alloc(8);
  header.write('RIFF', 0, 4, 'ascii');
  header.writeUInt32LE(4 + fmt.length + data.length + trnChunk.length, 4);
  return Buffer.concat([header, Buffer.from('WAVE'), fmt, data, trnChunk]);
}

export function buildUiMockPng(width = 375, height = 812): Buffer {
  const rowBytes = 1 + width * 3;
  const raw = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * rowBytes;
    raw[rowOffset] = 0;
    for (let x = 0; x < width; x += 1) {
      const px = rowOffset + 1 + x * 3;
      if (y < 60 || y >= height - 60) {
        raw[px] = 28;
        raw[px + 1] = 32;
        raw[px + 2] = 44;
      } else if (x > 30 && x < width - 30 && y > 140 && y < 220) {
        raw[px] = 235;
        raw[px + 1] = 238;
        raw[px + 2] = 245;
      } else {
        raw[px] = 245;
        raw[px + 1] = 246;
        raw[px + 2] = 250;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const idat = deflateSync(raw);
  const chunk = (type: string, payload: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(payload.length, 0);
    return Buffer.concat([len, Buffer.from(type), payload, Buffer.alloc(4)]);
  };
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const RICH_MOBILE_STRUCTURE = {
  screens: ['dashboard', 'onboarding', 'checkout', 'settings', 'profile'],
  userRoles: ['admin', 'user', 'customer'],
  workflows: ['onboarding', 'checkout', 'authentication', 'administration'],
  integrations: ['Stripe', 'SendGrid'],
  platformTargets: ['iOS', 'Android'],
  dataEntities: ['user', 'order', 'product'],
  businessRules: ['Admin must approve checkout', 'Users must authenticate before checkout'],
};

export const FOUNDER_SIMULATION_SCENARIOS: readonly FounderSimulationScenario[] = [
  {
    readOnly: true,
    scenarioId: 'scenario-simple-app',
    scenarioName: 'Simple App Idea',
    scenarioType: 'SIMPLE_APP',
    typedPrompt: 'Build a simple todo app with login, task list, and settings screens for web users.',
    structuredPrompt: {
      screens: ['login', 'task list', 'settings'],
      userRoles: ['user'],
      workflows: ['authentication'],
      platformTargets: ['WEB'],
      dataEntities: ['user', 'task'],
    },
    includeVisualUpload: false,
    includeVoiceUpload: false,
  },
  {
    readOnly: true,
    scenarioId: 'scenario-marketplace',
    scenarioName: 'Complex Marketplace',
    scenarioType: 'COMPLEX_MARKETPLACE',
    typedPrompt:
      'Build a two-sided marketplace for vendors and buyers with onboarding, product catalog, checkout, vendor dashboard, admin approval, Stripe payments, and messaging.',
    structuredPrompt: {
      screens: ['onboarding', 'catalog', 'checkout', 'vendor dashboard', 'admin', 'messaging'],
      userRoles: ['vendor', 'buyer', 'admin'],
      workflows: ['onboarding', 'checkout', 'messaging', 'administration', 'approval'],
      integrations: ['Stripe'],
      platformTargets: ['WEB', 'MOBILE'],
      dataEntities: ['user', 'product', 'order', 'vendor'],
      businessRules: ['Admin must approve vendors', 'Buyers must authenticate before checkout'],
    },
    includeVisualUpload: true,
    includeVoiceUpload: false,
  },
  {
    readOnly: true,
    scenarioId: 'scenario-mobile-first',
    scenarioName: 'Mobile-First App',
    scenarioType: 'MOBILE_FIRST',
    typedPrompt:
      'Uber-style ride sharing app for iOS and Android with driver and rider roles, ride request, tracking, payments, and onboarding.',
    structuredPrompt: {
      screens: ['ride request', 'driver dashboard', 'rider home', 'tracking', 'onboarding', 'payments'],
      userRoles: ['driver', 'rider'],
      workflows: ['onboarding', 'ride request', 'tracking', 'payments'],
      integrations: ['Stripe'],
      platformTargets: ['iOS', 'Android'],
      dataEntities: ['user', 'ride', 'driver', 'rider'],
      businessRules: ['Drivers must complete onboarding before accepting rides'],
    },
    includeVisualUpload: true,
    includeVoiceUpload: true,
    voiceTranscript: 'Drivers and riders connect through a mobile app with ride requests, tracking, and payments.',
  },
  {
    readOnly: true,
    scenarioId: 'scenario-saas-dashboard',
    scenarioName: 'SaaS Dashboard',
    scenarioType: 'SAAS_DASHBOARD',
    typedPrompt:
      'Build a SaaS analytics dashboard for web with signup, login, billing, team management, admin settings, Stripe subscriptions, and reporting workflows.',
    structuredPrompt: {
      screens: ['signup', 'login', 'dashboard', 'billing', 'team', 'settings', 'reports'],
      userRoles: ['admin', 'member'],
      workflows: ['authentication', 'billing', 'reporting', 'team management'],
      integrations: ['Stripe'],
      platformTargets: ['WEB'],
      dataEntities: ['user', 'account', 'subscription'],
      businessRules: ['Admin manages team billing'],
    },
    includeVisualUpload: false,
    includeVoiceUpload: false,
  },
  {
    readOnly: true,
    scenarioId: 'scenario-ai-powered',
    scenarioName: 'AI-Powered Product',
    scenarioType: 'AI_POWERED',
    typedPrompt:
      'Build an AI assistant product with chat UI, prompt history, user accounts, OpenAI integration, subscription billing, and admin analytics dashboard.',
    structuredPrompt: {
      screens: ['chat', 'history', 'billing', 'dashboard', 'settings'],
      userRoles: ['user', 'admin'],
      workflows: ['authentication', 'billing', 'ai chat'],
      integrations: ['OpenAI', 'Stripe'],
      platformTargets: ['WEB'],
      dataEntities: ['user', 'conversation', 'subscription'],
      businessRules: ['Users must subscribe before unlimited AI usage'],
    },
    includeVisualUpload: false,
    includeVoiceUpload: false,
  },
  {
    readOnly: true,
    scenarioId: 'scenario-ecommerce',
    scenarioName: 'E-Commerce Product',
    scenarioType: 'E_COMMERCE',
    typedPrompt:
      'Build an e-commerce store with product catalog, cart, checkout, order tracking, customer accounts, Stripe and PayPal, email notifications.',
    structuredPrompt: {
      screens: ['catalog', 'cart', 'checkout', 'orders', 'account'],
      userRoles: ['customer', 'admin'],
      workflows: ['checkout', 'order tracking', 'authentication'],
      integrations: ['Stripe', 'PayPal'],
      platformTargets: ['WEB', 'MOBILE'],
      dataEntities: ['user', 'product', 'order', 'cart'],
      businessRules: ['Customers must login before checkout'],
    },
    includeVisualUpload: true,
    includeVoiceUpload: false,
  },
  {
    readOnly: true,
    scenarioId: 'scenario-incomplete',
    scenarioName: 'Incomplete Vague Prompt',
    scenarioType: 'INCOMPLETE_VAGUE',
    typedPrompt: 'Make an app.',
    includeVisualUpload: false,
    includeVoiceUpload: false,
    expectedMaxVerdict: 'NEEDS_CLARIFICATION',
  },
  {
    readOnly: true,
    scenarioId: 'scenario-conflict',
    scenarioName: 'Conflicting Evidence',
    scenarioType: 'CONFLICTING_EVIDENCE',
    typedPrompt: 'Build a web app dashboard for desktop users with admin role.',
    conflictingWebPrompt: 'Build a web app dashboard for desktop users with admin role.',
    structuredPrompt: {
      screens: ['dashboard'],
      userRoles: ['admin'],
      workflows: ['onboarding'],
      platformTargets: ['WEB'],
    },
    includeVisualUpload: true,
    includeVoiceUpload: true,
    voiceTranscript: 'Build a mobile app for iOS and Android with dashboard, onboarding, and Stripe checkout.',
    expectedMaxVerdict: 'READY_FOR_PLANNING',
  },
  {
    readOnly: true,
    scenarioId: 'scenario-screenshot',
    scenarioName: 'Screenshot-Supported Project',
    scenarioType: 'SCREENSHOT_SUPPORTED',
    typedPrompt: 'Build a mobile app based on the attached UI reference with dashboard and onboarding.',
    structuredPrompt: {
      screens: ['dashboard', 'onboarding'],
      userRoles: ['user'],
      workflows: ['onboarding'],
      platformTargets: ['iOS', 'Android'],
    },
    includeVisualUpload: true,
    includeVoiceUpload: false,
  },
  {
    readOnly: true,
    scenarioId: 'scenario-voice-note',
    scenarioName: 'Voice-Note-Supported Project',
    scenarioType: 'VOICE_NOTE_SUPPORTED',
    typedPrompt: 'Build the product described in the voice note.',
    includeVisualUpload: false,
    includeVoiceUpload: true,
    voiceTranscript:
      'Build a mobile app for iOS and Android with OAuth login, dashboard, settings, onboarding, checkout using Stripe. Admin users must approve orders.',
    structuredPrompt: {
      screens: ['dashboard', 'settings', 'onboarding', 'checkout'],
      userRoles: ['admin', 'user'],
      workflows: ['onboarding', 'checkout', 'authentication'],
      integrations: ['Stripe'],
      platformTargets: ['iOS', 'Android'],
      dataEntities: ['user', 'order'],
      businessRules: ['Admin must approve orders'],
    },
  },
];

export function getFounderSimulationScenarios(): readonly FounderSimulationScenario[] {
  return FOUNDER_SIMULATION_SCENARIOS;
}

export function getFounderSimulationScenarioByType(
  scenarioType: FounderSimulationScenario['scenarioType'],
): FounderSimulationScenario | undefined {
  return FOUNDER_SIMULATION_SCENARIOS.find((s) => s.scenarioType === scenarioType);
}
