const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

async function runCinematicDemo() {
  const outputDir = path.join(__dirname, 'video_output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Launching browser with 1920x1080 video recording...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--window-size=1920,1080']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: outputDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  // Helper for cinematic mouse movement & smooth scrolling
  async function smoothScroll(distance, steps = 25, delay = 35) {
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, distance / steps);
      await page.waitForTimeout(delay);
    }
  }

  // Helper for slow human-like typing
  async function humanType(selector, text, delayBetweenChar = 50) {
    const el = await page.$(selector);
    if (el) {
      await el.click();
      for (const char of text) {
        await page.keyboard.type(char);
        await page.waitForTimeout(delayBetweenChar);
      }
    }
  }

  console.log('Scene 1: Opening GITIT Live Platform (https://gitit-hiring.vercel.app)...');
  await page.goto('https://gitit-hiring.vercel.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500); // 3.5s intro pause

  console.log('Scene 2: Navigating to Candidate Input Section & Entering Data...');
  await smoothScroll(450, 20, 30);
  await page.waitForTimeout(1500);

  // Enter GitHub handle
  const githubSelectors = [
    'input[placeholder*="github" i]',
    'input[placeholder*="username" i]',
    'input[type="text"]'
  ];

  for (const sel of githubSelectors) {
    const el = await page.$(sel);
    if (el) {
      await humanType(sel, 'bhaupupu', 80);
      break;
    }
  }
  await page.waitForTimeout(1500);

  // Upload Resume File if file input exists
  const fileInput = await page.$('input[type="file"]');
  const resumePath = 'C:\\Users\\gupta\\.gemini\\antigravity\\brain\\bf8a1c11-1754-43ce-bc68-e5dacc3b8d7b\\scratch\\diwanshu_gupta_resume.txt';
  if (fileInput && fs.existsSync(resumePath)) {
    console.log('Uploading Diwanshu Gupta Resume file...');
    await fileInput.setInputFiles(resumePath);
    await page.waitForTimeout(2000);
  }

  // Enter Job Description if textarea exists
  const jdTextarea = 'textarea';
  const foundJd = await page.$(jdTextarea);
  if (foundJd) {
    console.log('Typing Job Description...');
    const jdText = 'Senior Full-Stack AI Engineer with expertise in Next.js, Node.js, Python, multi-agent systems, and code analysis.';
    await humanType(jdTextarea, jdText, 30);
    await page.waitForTimeout(1500);
  }

  // Click Submit / Analyze Button
  console.log('Scene 3: Triggering Multi-Agent Evaluation Engine...');
  const submitBtn = 'button:has-text("ANALYZE"), button:has-text("START"), button:has-text("EVALUATE"), button:has-text("GENERATE"), button[type="submit"]';
  const btn = await page.$(submitBtn);
  if (btn) {
    await btn.click();
    console.log('Clicked evaluation button, waiting for results...');
    await page.waitForTimeout(4000);
  }

  // Direct Navigation to Candidate Profile View
  console.log('Scene 4: Navigating to Candidate Profile View...');
  await page.goto('https://gitit-hiring.vercel.app/resumes', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const profileLink = await page.$('a[href*="/profile/"]');
  if (profileLink) {
    await profileLink.click();
    await page.waitForTimeout(3000);
  } else {
    await page.goto('https://gitit-hiring.vercel.app/profile/1', { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(3000);
  }

  // Scroll through Candidate Profile
  console.log('Scene 5: Cinematic Tour of Scorecard, Technical Breakdown & 15-Question Suite...');
  await page.waitForTimeout(2000);

  // Smooth scroll down to Scorecard & Skills Matrix
  await smoothScroll(650, 25, 40);
  await page.waitForTimeout(3000);

  // Smooth scroll down to 15-Question Technical Interview Suite
  await smoothScroll(650, 25, 40);
  await page.waitForTimeout(3500);

  // Click Technical Interview Suite tab if visible
  const interviewTab = await page.$('button:has-text("INTERVIEW"), button:has-text("TECHNICAL INTERVIEW SUITE")');
  if (interviewTab) {
    await interviewTab.click();
    await page.waitForTimeout(2500);
    await smoothScroll(600, 25, 30);
    await page.waitForTimeout(3500);
  }

  // Final hold on overview & recommendations
  await smoothScroll(-350, 15, 30);
  await page.waitForTimeout(3500);

  console.log('Demo completed! Closing video session...');
  await page.close();
  await context.close();
  await browser.close();

  // Find saved video file
  const files = fs.readdirSync(outputDir);
  const videoFile = files.find(f => f.endsWith('.webm'));
  if (videoFile) {
    const videoPath = path.join(outputDir, videoFile);
    const artifactPath = 'C:\\Users\\gupta\\.gemini\\antigravity\\brain\\bf8a1c11-1754-43ce-bc68-e5dacc3b8d7b\\gitit_cinematic_demo.webm';
    if (fs.existsSync(artifactPath)) fs.unlinkSync(artifactPath);
    fs.copyFileSync(videoPath, artifactPath);
    console.log(`Cinematic video saved to: ${artifactPath}`);
  }
}

runCinematicDemo().catch(err => {
  console.error('Error running cinematic demo:', err);
});
