// Cruzen Digital Premium Interactions, Animations & Consultation Wizard (Optimized for 60fps)

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // Spotlight Glow Effect Coordinate Tracker
    // ----------------------------------------------------
    const spotlightCards = document.querySelectorAll('.service-card-premium, .why-card, .stat-badge, .blog-card');
    spotlightCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // ----------------------------------------------------
    // Lag-Free Sticky Header (sentinel Intersection Observer)
    // ----------------------------------------------------
    const header = document.querySelector('.header');
    const sentinel = document.getElementById('scroll-sentinel');

    if (sentinel && header) {
        const headerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            });
        }, {
            root: null,
            threshold: 0,
            rootMargin: '0px'
        });

        headerObserver.observe(sentinel);
    }

    // ----------------------------------------------------
    // Intersection Observer for Scroll Reveals
    // ----------------------------------------------------
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                
                // If it contains counter elements, trigger counter animations
                const counters = entry.target.querySelectorAll('.counter');
                if (counters.length > 0) {
                    counters.forEach(counter => animateCounter(counter));
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05, // Lower threshold triggers animation slightly earlier
        rootMargin: '0px 0px -30px 0px'
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // ----------------------------------------------------
    // Numeric Counter Animation using requestAnimationFrame (Buttery Smooth)
    // ----------------------------------------------------
    function animateCounter(counter) {
        if (counter.classList.contains('counted')) return;
        counter.classList.add('counted');
        
        const target = +counter.getAttribute('data-target');
        const duration = 1800; // 1.8 seconds duration
        let startTime = null;

        function updateCounter(currentTime) {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            
            // Easing function: easeOutQuad
            const easedProgress = progress * (2 - progress);
            const value = Math.floor(easedProgress * target);
            
            counter.textContent = value;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        }

        requestAnimationFrame(updateCounter);
    }

    // ----------------------------------------------------
    // Hero Mockup Dashboard Value Animation (requestAnimationFrame)
    // ----------------------------------------------------
    const chartBars = document.querySelectorAll('.chart-bar');
    const revMetric = document.getElementById('rev-metric');
    const convMetric = document.getElementById('conv-metric');

    // Trigger dashboard load animations
    setTimeout(() => {
        // 1. Chart bars transition height
        chartBars.forEach(bar => {
            const targetHeight = bar.style.height;
            bar.style.height = '0';
            setTimeout(() => {
                bar.style.transition = 'height 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
                bar.style.height = targetHeight;
            }, 100);
        });

        // 2. Animate Revenue roll-up
        if (revMetric) {
            const targetRev = 148250;
            const revDuration = 2000;
            let revStartTime = null;

            function animateRev(timestamp) {
                if (!revStartTime) revStartTime = timestamp;
                const progress = Math.min((timestamp - revStartTime) / revDuration, 1);
                
                // easeOutQuad
                const easedProgress = progress * (2 - progress);
                const currentVal = Math.floor(easedProgress * targetRev);
                
                revMetric.textContent = '$' + currentVal.toLocaleString();

                if (progress < 1) {
                    requestAnimationFrame(animateRev);
                } else {
                    revMetric.textContent = '$148,250';
                }
            }
            requestAnimationFrame(animateRev);
        }

        // 3. Animate Conversion Rate roll-up
        if (convMetric) {
            const targetConv = 3.84;
            const convDuration = 2000;
            let convStartTime = null;

            function animateConv(timestamp) {
                if (!convStartTime) convStartTime = timestamp;
                const progress = Math.min((timestamp - convStartTime) / convDuration, 1);
                
                // easeOutQuad
                const easedProgress = progress * (2 - progress);
                const currentVal = easedProgress * targetConv;
                
                convMetric.textContent = currentVal.toFixed(2) + '%';

                if (progress < 1) {
                    requestAnimationFrame(animateConv);
                } else {
                    convMetric.textContent = '3.84%';
                }
            }
            requestAnimationFrame(animateConv);
        }
    }, 500);

    // ----------------------------------------------------
    // Mobile Navigation Dropdown Trigger
    // ----------------------------------------------------
    const dropdownTrigger = document.querySelector('.dropdown-trigger');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (dropdownTrigger && dropdownMenu) {
        dropdownTrigger.addEventListener('click', (e) => {
            if (window.innerWidth <= 992) {
                e.preventDefault();
                dropdownMenu.style.position = 'static';
                dropdownMenu.style.transform = 'none';
                dropdownMenu.style.opacity = dropdownMenu.style.opacity === '1' ? '0' : '1';
                dropdownMenu.style.pointerEvents = dropdownMenu.style.pointerEvents === 'auto' ? 'none' : 'auto';
            }
        });
    }

    // ----------------------------------------------------
    // FAQ Accordion Expand / Collapse
    // ----------------------------------------------------
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const currentItem = header.parentElement;
            const isActive = currentItem.classList.contains('active');
            
            // Close all items
            document.querySelectorAll('.accordion-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Toggle active on clicked item
            if (!isActive) {
                currentItem.classList.add('active');
            }
        });
    });

    // ----------------------------------------------------
    // Modal Overlay Elements
    // ----------------------------------------------------
    const promoModal = document.getElementById('promo-modal');
    const consultationModal = document.getElementById('consultation-modal');

    const closePromoBtn = document.getElementById('close-promo-btn');
    const closeConsultationBtn = document.getElementById('close-consultation-btn');
    const successCloseBtn = document.getElementById('success-close-btn');

    const openConsultBtns = document.querySelectorAll('.open-consultation-btn');
    const promoBodyBtn = document.getElementById('promo-body-btn');

    // Show Promotion Modal on Visit (After 2 seconds)
    setTimeout(() => {
        if (promoModal && !localStorage.getItem('promoShown')) {
            promoModal.classList.add('active');
            localStorage.setItem('promoShown', 'true');
        }
    }, 2000);

    // Close Promo Modal
    if (closePromoBtn) {
        closePromoBtn.addEventListener('click', () => {
            promoModal.classList.remove('active');
        });
    }

    // Close Consultation Modal
    if (closeConsultationBtn) {
        closeConsultationBtn.addEventListener('click', () => {
            consultationModal.classList.remove('active');
            resetWizard();
        });
    }
    if (successCloseBtn) {
        successCloseBtn.addEventListener('click', () => {
            consultationModal.classList.remove('active');
            resetWizard();
        });
    }

    // Close on overlay click
    window.addEventListener('click', (e) => {
        if (e.target === promoModal) {
            promoModal.classList.remove('active');
        }
        if (e.target === consultationModal) {
            consultationModal.classList.remove('active');
            resetWizard();
        }
    });

    // Open Consultation Modal via Click
    openConsultBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            consultationModal.classList.add('active');
        });
    });

    // Click Promo Popup -> Close Promo and Open Consultation directly
    if (promoBodyBtn) {
        promoBodyBtn.addEventListener('click', () => {
            promoModal.classList.remove('active');
            setTimeout(() => {
                consultationModal.classList.add('active');
            }, 250);
        });
    }

    // ----------------------------------------------------
    // Multi-Step Consultation Wizard Logic
    // ----------------------------------------------------
    let currentStep = 1;
    const totalSteps = 3;

    const nextBtn = document.getElementById('next-step-btn');
    const prevBtn = document.getElementById('prev-step-btn');
    const submitBtn = document.getElementById('submit-wizard-btn');
    const wizardFooter = document.querySelector('.wizard-footer');

    const lineFill = document.getElementById('wizard-line-fill');
    const form = document.getElementById('consultation-form');

    function updateWizardUI() {
        // Slide horizontal transition setup
        const steps = document.querySelectorAll('.wizard-step');
        steps.forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.remove('active', 'slide-out-left', 'slide-out-right');
            
            if (stepNum === currentStep) {
                step.classList.add('active');
            } else if (stepNum < currentStep) {
                step.classList.add('slide-out-left');
            } else {
                step.classList.add('slide-out-right');
            }
        });

        // Update progress line fill width
        if (lineFill) {
            const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
            lineFill.style.width = `${percentage}%`;
        }

        // Update step indicator node states (active, completed)
        document.querySelectorAll('.step-indicator').forEach((ind, index) => {
            const stepNum = index + 1;
            if (stepNum < currentStep) {
                ind.classList.add('completed');
                ind.classList.remove('active');
            } else if (stepNum === currentStep) {
                ind.classList.add('active');
                ind.classList.remove('completed');
            } else {
                ind.classList.remove('active', 'completed');
            }
        });

        // Toggle buttons visibility
        if (currentStep === 1) {
            prevBtn.disabled = true;
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
        } else if (currentStep === totalSteps) {
            prevBtn.disabled = false;
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-block';
        } else {
            prevBtn.disabled = false;
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
        }
    }

    function validateStep(step) {
        if (step === 1) {
            return true;
        }
        if (step === 2) {
            const dateInput = document.getElementById('inputdate');
            const timeSelect = document.getElementById('inputtime');
            
            if (!dateInput.value) {
                dateInput.reportValidity();
                return false;
            }
            if (!timeSelect.value) {
                timeSelect.reportValidity();
                return false;
            }
            return true;
        }
        if (step === 3) {
            const nameInput = document.getElementById('fullname');
            const phoneInput = document.getElementById('phone');
            const emailInput = document.getElementById('email');
            const termsCheck = document.getElementById('terms');

            if (!nameInput.value.trim()) {
                nameInput.reportValidity();
                return false;
            }
            if (!phoneInput.value.match(/^[0-9]{10}$/)) {
                phoneInput.setCustomValidity("Please enter a valid 10-digit mobile number.");
                phoneInput.reportValidity();
                return false;
            } else {
                phoneInput.setCustomValidity("");
            }
            if (!emailInput.value.trim() || !emailInput.checkValidity()) {
                emailInput.reportValidity();
                return false;
            }
            if (!termsCheck.checked) {
                termsCheck.setCustomValidity("Please accept the terms to proceed.");
                termsCheck.reportValidity();
                return false;
            } else {
                termsCheck.setCustomValidity("");
            }
            return true;
        }
        return true;
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                currentStep++;
                updateWizardUI();
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateWizardUI();
            }
        });
    }

    // Submit consultation form
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (validateStep(3)) {
                console.log("Submitting consultation request...");
                
                // Show success screen step
                document.querySelectorAll('.wizard-step').forEach(step => {
                    step.classList.remove('active');
                });
                document.getElementById('wizard-step-success').classList.add('active');
                
                // Hide footer
                wizardFooter.style.display = 'none';
                if (lineFill) lineFill.style.width = '100%';
            }
        });
    }

    function resetWizard() {
        currentStep = 1;
        if (form) form.reset();
        wizardFooter.style.display = 'flex';
        updateWizardUI();
    }

    // ----------------------------------------------------
    // Services Category Filtering & Live Keywords Search
    // ----------------------------------------------------
    const servicesTabs = document.querySelectorAll('.tab-btn');
    const servicesGrid = document.getElementById('main-services-grid');
    const servicesSearch = document.getElementById('services-search-box');
    const headerSearch = document.getElementById('header-search');
    const servicesEmpty = document.getElementById('services-empty-state');
    const servicesClearBtn = document.getElementById('services-clear-search-btn');

    if (servicesGrid && servicesSearch) { // Make sure we are on services.html
        const serviceCards = servicesGrid.querySelectorAll('.service-card-premium');
        let activeTab = 'all';
        let searchQuery = '';

        function filterServices() {
            let visibleCount = 0;

            serviceCards.forEach(card => {
                const category = card.getAttribute('data-category');
                const keywords = (card.getAttribute('data-search-keywords') || '').toLowerCase();
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('p').textContent.toLowerCase();

                const matchesTab = activeTab === 'all' || category === activeTab;
                const matchesSearch = searchQuery === '' || 
                                      keywords.includes(searchQuery) || 
                                      title.includes(searchQuery) || 
                                      description.includes(searchQuery);

                if (matchesTab && matchesSearch) {
                    card.style.display = 'flex';
                    visibleCount++;
                    // Add micro-animation fade in
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0) scale(1)';
                } else {
                    card.style.display = 'none';
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(10px) scale(0.98)';
                }
            });

            if (visibleCount === 0) {
                if (servicesEmpty) servicesEmpty.style.display = 'block';
                servicesGrid.style.display = 'none';
            } else {
                if (servicesEmpty) servicesEmpty.style.display = 'none';
                servicesGrid.style.display = 'grid';
            }
        }

        // Tab click filters
        servicesTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                servicesTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                activeTab = tab.getAttribute('data-tab');
                filterServices();
            });
        });

        // Local search input
        if (servicesSearch) {
            servicesSearch.addEventListener('input', (e) => {
                searchQuery = e.target.value.toLowerCase().trim();
                filterServices();
            });
        }

        // Clear search
        if (servicesClearBtn) {
            servicesClearBtn.addEventListener('click', () => {
                if (servicesSearch) servicesSearch.value = '';
                if (headerSearch) headerSearch.value = '';
                searchQuery = '';
                filterServices();
            });
        }

        // Header search sync
        if (headerSearch) {
            headerSearch.addEventListener('input', (e) => {
                const val = e.target.value;
                if (servicesSearch) {
                    servicesSearch.value = val;
                    searchQuery = val.toLowerCase().trim();
                    filterServices();
                }
            });
        }

        // URL Parameters On Load
        const urlParams = new URLSearchParams(window.location.search);
        const searchParam = urlParams.get('search');
        const tabParam = urlParams.get('tab');

        if (tabParam) {
            activeTab = tabParam;
            servicesTabs.forEach(tab => {
                if (tab.getAttribute('data-tab') === tabParam) {
                    servicesTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                }
            });
        }
        if (searchParam) {
            searchQuery = searchParam.toLowerCase().trim();
            if (servicesSearch) servicesSearch.value = searchParam;
            if (headerSearch) headerSearch.value = searchParam;
        }
        if (tabParam || searchParam) {
            filterServices();
        }
    } else {
        // Redirection logic from index.html / blog.html
        if (headerSearch) {
            headerSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const val = e.target.value.trim();
                    window.location.href = `services.html?search=${encodeURIComponent(val)}`;
                }
            });
        }
    }

    // ----------------------------------------------------
    // Wizard Modal Dynamic Pre-selection & Step Skip
    // ----------------------------------------------------
    const consultBtns = document.querySelectorAll('.open-consultation-btn, .btn-service-action');
    consultBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const serviceSelectValue = btn.getAttribute('data-service-select');
            
            if (serviceSelectValue && form) {
                // Find radio button in modal
                const radioInput = form.querySelector(`input[name="service"][value="${serviceSelectValue}"]`);
                if (radioInput) {
                    radioInput.checked = true;
                    // Auto-advance to Step 2
                    currentStep = 2;
                    updateWizardUI();
                }
            } else {
                // Standard launch from header/cta, start at step 1
                currentStep = 1;
                updateWizardUI();
            }
        });
    });

    // ----------------------------------------------------
    // DDS Studio & Zentry Premium Cursors, 3D Tilts & Magnetic Attraction
    // ----------------------------------------------------

    // 1. Dynamic DOM Injection of Noise and Custom Cursors
    const noiseLayer = document.createElement('div');
    noiseLayer.className = 'noise-overlay';
    document.body.appendChild(noiseLayer);

    const mainCursor = document.createElement('div');
    mainCursor.className = 'custom-cursor';
    const cursorFollower = document.createElement('div');
    cursorFollower.className = 'custom-cursor-follower';
    document.body.appendChild(mainCursor);
    document.body.appendChild(cursorFollower);

    // Track mouse coordinates
    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Instant position for primary dot
        mainCursor.style.left = `${mouseX}px`;
        mainCursor.style.top = `${mouseY}px`;
    });

    // Buttery Smooth LERP tracking loop
    function updateCursorPosition() {
        const lerpFactor = 0.12;
        followerX += (mouseX - followerX) * lerpFactor;
        followerY += (mouseY - followerY) * lerpFactor;

        cursorFollower.style.left = `${followerX}px`;
        cursorFollower.style.top = `${followerY}px`;

        // Stretch dynamic effect based on speed/delta
        const deltaX = mouseX - followerX;
        const deltaY = mouseY - followerY;
        const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const scaleX = Math.min(1 + speed * 0.012, 1.6);
        const scaleY = Math.max(1 - speed * 0.008, 0.6);
        
        // Calculate angle of motion
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

        if (cursorFollower.classList.contains('active')) {
            cursorFollower.style.transform = `translate(-50%, -50%) scale(1)`;
        } else {
            cursorFollower.style.transform = `translate(-50%, -50%) rotate(${angle}deg) scale(${scaleX}, ${scaleY})`;
        }

        requestAnimationFrame(updateCursorPosition);
    }
    requestAnimationFrame(updateCursorPosition);

    // Morph follower on hover over interactive tags
    const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, .why-card, .tilted-card, .service-card-premium, .blog-card, .radio-card, .accordion-header');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            mainCursor.classList.add('active');
            cursorFollower.classList.add('active');
            
            // Context-aware labels
            if (el.classList.contains('btn-service-action') || el.classList.contains('btn-consult')) {
                cursorFollower.innerHTML = '<span>BOOK</span>';
            } else if (el.classList.contains('read-more-link') || el.closest('.blog-card')) {
                cursorFollower.innerHTML = '<span>READ</span>';
            } else if (el.classList.contains('btn-primary-premium') || el.closest('.tilted-card') || el.closest('.services-cta-row a')) {
                cursorFollower.innerHTML = '<span>VIEW</span>';
            } else {
                cursorFollower.innerHTML = '';
            }
        });
        
        el.addEventListener('mouseleave', () => {
            mainCursor.classList.remove('active');
            cursorFollower.classList.remove('active');
            cursorFollower.innerHTML = '';
        });
    });

    // Hide cursors when leaving viewport
    document.addEventListener('mouseleave', () => {
        mainCursor.style.opacity = '0';
        cursorFollower.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
        mainCursor.style.opacity = '1';
        cursorFollower.style.opacity = '1';
    });

    // 2. 3D Perspective Card Tilt (Zentry style)
    const tiltElements = document.querySelectorAll('.service-card-premium, .tilted-card, .blog-card, .why-card');
    tiltElements.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate rotate degrees (max 8 degrees)
            const rotateX = ((y - centerY) / centerY) * 8;
            const rotateY = -((x - centerX) / centerX) * 8;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
        });
        
        card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease';
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });

    // 3. Magnetic Hover Button Attraction
    const magneticBtns = document.querySelectorAll('.btn-primary-premium, .btn-consult, .btn-login, .logo a, .top-links a');
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const btnX = rect.left + rect.width / 2;
            const btnY = rect.top + rect.height / 2;
            
            // Distance from center of button
            const distX = e.clientX - btnX;
            const distY = e.clientY - btnY;
            
            // Magnetic pull strength (30% offset tracking)
            btn.style.transform = `translate(${distX * 0.35}px, ${distY * 0.35}px)`;
            
            // Pull children elements slightly less
            const iconOrSpan = btn.querySelector('i, span');
            if (iconOrSpan) {
                iconOrSpan.style.transform = `translate(${distX * 0.15}px, ${distY * 0.15}px)`;
                iconOrSpan.style.transition = 'none';
            }
        });
        
        btn.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
            const iconOrSpan = btn.querySelector('i, span');
            if (iconOrSpan) {
                iconOrSpan.style.transform = 'translate(0, 0)';
                iconOrSpan.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
            }
        });
    });

    // Also support traditional mouse coordinates tracker for spotlight (backward compatibility)
    const spotlightCards = document.querySelectorAll('.service-card-premium, .why-card, .stat-badge, .blog-card');
    spotlightCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
});
