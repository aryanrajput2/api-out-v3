const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Helper for delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log('Starting search-to-book-to-cancel demo automation...');
  
  // Launch browser
  const browser = await chromium.launch({
    headless: true // Keep it headless so it runs cleanly in background
  });

  // Create context with video recording enabled
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: './videos/',
      size: { width: 1280, height: 800 }
    }
  });

  // Open page
  const page = await context.newPage();

  // Pipe page console and errors to Node terminal
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE EXCEPTION:', err.message));

  try {
    console.log('Navigating to local hotel UI...');
    await page.goto('http://localhost:8000/home/');
    
    // Wait for login page
    console.log('Waiting for login page...');
    await page.waitForSelector('#login-email', { visible: true });
    await delay(2000); // Visual pause

    // Enter login credentials
    console.log('Entering credentials...');
    await page.fill('#login-email', 'aryan.singh@tripjack.com');
    await delay(500);
    await page.fill('#login-password', '123@abc');
    await delay(1000);
    
    // Click Sign In
    console.log('Submitting credentials...');
    await page.click('#login-submit-btn');
    
    // Wait for OTP field
    console.log('Waiting for OTP...');
    await page.waitForSelector('#login-otp', { visible: true });
    await delay(1000);
    
    // Enter OTP
    await page.fill('#login-otp', '7890');
    await delay(1000);
    
    // Submit OTP
    console.log('Submitting OTP...');
    await page.click('#login-submit-btn');
    
    // Wait for Search Page to load
    console.log('Waiting for Search page...');
    await page.waitForSelector('#config-env', { visible: true });
    await delay(2000); // Let user see the dashboard

    // Configure test environment (Sandbox & Abhi Test Agent Key)
    console.log('Configuring API environment to Sandbox...');
    await page.selectOption('#config-env', 'https://apitest-hms.tripjack.com/');
    await delay(1500); // Wait for dropdown trigger and banner changes
    
    console.log('Selecting Sandbox API Key (Abhi Test Agent)...');
    await page.selectOption('#config-apikey-select', '6116982da6b759-28f8-4cdf-b210-04cb98116165');
    await delay(1500);

    // Click Dubai batch search button
    console.log('Triggering Dubai batch hotel search...');
    await page.click('button.batch-search-btn:has-text("Dubai")');
    
    // Wait for search loading overlay to disappear
    console.log('Waiting for search results...');
    await page.waitForSelector('#search-loading-overlay', { state: 'hidden', timeout: 45000 });
    await page.waitForSelector('#results .hotel-card', { visible: true, timeout: 30000 });
    
    console.log('Search results loaded. Viewing results...');
    await delay(4000); // Visual pause to look at results

    // Click View Rooms on the first hotel card
    console.log('Selecting first hotel and viewing rooms...');
    await page.locator('#results .hotel-card button.btn-premium').first().click();
    
    // Wait for room details to load
    console.log('Waiting for room options...');
    await page.waitForSelector('#detail-results .detail-option-card', { visible: true, timeout: 30000 });
    await delay(4000); // Visual pause to view options

    // Scroll down a bit to show room options clearly
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
    await delay(1500);

    // Click Review & Lock on the first REDEEMABLE / REFUNDABLE room option
    console.log('Reviewing and locking the first refundable room option...');
    await page.locator('#detail-results .detail-option-card[data-refundable="true"] button.btn-premium').first().click();
    
    // Wait for review details to load
    console.log('Waiting for review page...');
    await page.waitForSelector('#review-content', { visible: true, timeout: 30000 });
    await delay(4000); // Let user see prefilled traveler details and price summary

    // Scroll down to the booking actions
    console.log('Scrolling to booking actions...');
    await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' }));
    await delay(2000);

    // Click Voucher Booking
    console.log('Submitting Voucher Booking...');
    await page.click('button:has-text("Voucher Booking")');
    
    // Wait for booking confirmation detail page
    console.log('Waiting for booking confirmation...');
    await page.waitForSelector('#booking-detail-content', { visible: true, timeout: 45000 });
    await delay(5000); // Pause to see the Confirmed status banner and details

    // Handle confirm dialog automatically for cancellation
    page.on('dialog', async dialog => {
      console.log('Handling dialog:', dialog.message());
      await dialog.accept();
    });

    // Click Cancel Booking
    console.log('Initiating booking cancellation...');
    await page.click('button.btn-danger:has-text("Cancel Booking")');
    
    // Wait for cancellation success
    console.log('Waiting for cancellation to process...');
    await delay(7000); // Let processing overlay and automatic 2s reload complete
    
    console.log('Booking successfully cancelled!');
    await delay(4000); // Final pause to show cancelled state in video

    // Get video file path
    const video = page.video();
    const videoPath = await video.path();
    console.log('Temporary video saved at:', videoPath);

    // Close context and browser to save video
    await context.close();
    await browser.close();

    // Define target output path
    const targetDir = '/Users/tripjack/.gemini/antigravity-ide/brain/3a3aa0fe-24cc-4d6f-9cd1-59e8afa45e49';
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetPath = path.join(targetDir, 'demo_search_book_cancel.webm');
    
    // Copy video to target path
    fs.copyFileSync(videoPath, targetPath);
    console.log('Successfully saved demo video to:', targetPath);
    
    // Cleanup temp video
    try {
      fs.unlinkSync(videoPath);
      console.log('Cleaned up temporary video file.');
    } catch (err) {
      // Ignore
    }

    console.log('Demo video generation completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Demo automation failed:', err);
    if (page) {
      try {
        const errorPath = '/Users/tripjack/.gemini/antigravity-ide/brain/3a3aa0fe-24cc-4d6f-9cd1-59e8afa45e49/error_screenshot.png';
        await page.screenshot({ path: errorPath, fullPage: true });
        console.log('Screenshot of failure saved at:', errorPath);
      } catch (screenErr) {
        console.error('Failed to capture screenshot:', screenErr);
      }
    }
    process.exit(1);
  }
})();
