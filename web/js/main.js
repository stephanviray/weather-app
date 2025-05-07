// Global variables
let scene, camera, renderer, globe, raycaster, mouse, controls, sunLight;
const globeRadius = 100;
const API_KEY = 'ebdd281e718392cab0ed58d3111c8612'; // OpenWeather API key
const weatherMarkers = [];
let currentLocation = null;
let isDayMode = true;
let bookmarkedLocations = [];
let weatherEffects = [];
let rotationSpeed = 1.0; // Default rotation speed

// Expose variables to window object
window.scene = scene;
window.camera = camera;
window.globe = globe;
window.globeRadius = globeRadius;
window.API_KEY = API_KEY;

// Animation state
const animationState = {
    glow: null,
    pulseSpeed: 0.5,
    pulseIntensity: 0.1
};

// Calculate accurate sun position based on current time and date
function calculateSunPosition() {
    const now = new Date();
    
    // Get current time in Philippines (UTC+8)
    const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    
    // Get current UTC time
    const year = phTime.getUTCFullYear();
    const month = phTime.getUTCMonth() + 1;
    const day = phTime.getUTCDate();
    const hour = phTime.getUTCHours();
    const minute = phTime.getUTCMinutes();
    const second = phTime.getUTCSeconds();
    
    // Calculate Julian Date
    const a = Math.floor((14 - month) / 12);
    const yearOffset = year + 4800 - a;
    const m = month + 12 * a - 3;
    let JD = day + Math.floor((153 * m + 2) / 5) + 365 * yearOffset + Math.floor(yearOffset / 4) - Math.floor(yearOffset / 100) + Math.floor(yearOffset / 400) - 32045;
    JD += (hour - 12) / 24 + minute / 1440 + second / 86400;
    
    // Calculate number of centuries since J2000.0
    const T = (JD - 2451545.0) / 36525;
    
    // Calculate mean longitude of the sun
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    
    // Calculate mean anomaly of the sun
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    
    // Calculate eccentricity of Earth's orbit
    const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
    
    // Calculate equation of center
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * Math.PI / 180) +
              (0.019993 - 0.000101 * T) * Math.sin(2 * M * Math.PI / 180) +
              0.000289 * Math.sin(3 * M * Math.PI / 180);
    
    // Calculate true longitude of the sun
    const L = L0 + C;
    
    // Calculate apparent longitude of the sun
    const omega = 125.04 - 1934.136 * T;
    const lambda = L - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180);
    
    // Calculate obliquity of the ecliptic
    const epsilon = 23.43929111 - 0.013004167 * T - 0.0000001639 * T * T + 0.0000005036 * T * T * T;
    
    // Convert to Cartesian coordinates
    const x = Math.cos(lambda * Math.PI / 180);
    const yCoord = Math.sin(lambda * Math.PI / 180) * Math.cos(epsilon * Math.PI / 180);
    const z = Math.sin(lambda * Math.PI / 180) * Math.sin(epsilon * Math.PI / 180);
    
    // Scale the position to be far from the globe
    const distance = 500;
    
    // Adjust position for Philippines' location (around 13°N, 122°E)
    const phLat = 13 * Math.PI / 180;
    const phLng = 122 * Math.PI / 180;
    
    // Rotate the sun position to match Philippines' location
    const rotatedX = x * Math.cos(phLng) - z * Math.sin(phLng);
    const rotatedZ = x * Math.sin(phLng) + z * Math.cos(phLng);
    const rotatedY = yCoord * Math.cos(phLat) - rotatedZ * Math.sin(phLat);
    const finalZ = yCoord * Math.sin(phLat) + rotatedZ * Math.cos(phLat);
    
    return new THREE.Vector3(rotatedX * distance, rotatedY * distance, finalZ * distance);
}

// Initialize the 3D scene with enhanced lighting
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 200;
    
    // Create renderer with improved settings
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance",
        logarithmicDepthBuffer: true // Added for better depth handling
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true; // Enable for better line rendering
    document.getElementById('globe-container').appendChild(renderer.domElement);
    
    // Create starfield
    createStarfield();
    
    // Create globe
    createGlobe();
    
    // Update window objects
    window.scene = scene;
    window.camera = camera;
    window.globe = globe;
    
    // Add even lighting for the globe
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Increased ambient light for even illumination
    scene.add(ambientLight);
    
    // Add multiple point lights for even illumination
    const pointLight1 = new THREE.PointLight(0xffffff, 0.5);
    pointLight1.position.set(200, 200, 200);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xffffff, 0.5);
    pointLight2.position.set(-200, -200, -200);
    scene.add(pointLight2);
    
    const pointLight3 = new THREE.PointLight(0xffffff, 0.5);
    pointLight3.position.set(200, -200, 200);
    scene.add(pointLight3);
    
    const pointLight4 = new THREE.PointLight(0xffffff, 0.5);
    pointLight4.position.set(-200, 200, -200);
    scene.add(pointLight4);
    
    // Add hemisphere light for better ambient illumination
    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1.0);
    scene.add(hemisphereLight);
    
    // Initialize raycaster for globe interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Add orbit controls with improved settings
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.15;
    controls.minDistance = 150;
    controls.maxDistance = 500;
    controls.enablePan = false;
    controls.screenSpacePanning = false;
    controls.smoothZoom = true;
    controls.zoomSpeed = 0.5;
    
    // Add auto-rotation with slower speed
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.2 * rotationSpeed;
    
    // Add rotation speed control event listener
    const rotationSpeedControl = document.getElementById('rotation-speed');
    rotationSpeedControl.addEventListener('input', function(e) {
        rotationSpeed = parseFloat(e.target.value);
        controls.autoRotateSpeed = 0.2 * rotationSpeed;
    });
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('click', onGlobeClick);
    document.getElementById('search-button').addEventListener('click', searchLocation);
    document.getElementById('location-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchLocation();
        }
    });
    
    // Add camera update event listener to help with label positioning
    controls.addEventListener('change', () => {
        // Force update of any location labels during camera animation
        document.querySelectorAll('.location-label').forEach(label => {
            if (label.style.opacity > 0) {
                // Slight opacity pulse to refresh label rendering
                const currentOpacity = parseFloat(label.style.opacity);
                label.style.opacity = (currentOpacity * 0.95).toString();
                setTimeout(() => {
                    if (label && document.body.contains(label)) {
                        label.style.opacity = currentOpacity.toString();
                    }
                }, 50);
            }
        });
    });
    
    // Add new event listeners for enhanced controls
    document.getElementById('home-button').addEventListener('click', resetView);
    document.getElementById('zoom-in').addEventListener('click', zoomIn);
    document.getElementById('zoom-out').addEventListener('click', zoomOut);
    document.getElementById('toggle-day-night').addEventListener('click', toggleDayNight);
    document.getElementById('toggle-metrics').addEventListener('click', toggleMetrics);
    document.getElementById('bookmarks-button').addEventListener('click', toggleBookmarks);
    document.getElementById('add-current-location').addEventListener('click', saveCurrentLocation);
    
    // Load bookmarked locations from localStorage
    loadBookmarks();
    
    // Start animation loop
    animate();
}

// Create starfield
function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 1.5,
        transparent: true,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    const starVertices = [];
    const starColors = [];
    const starSizes = [];

    // Create more stars with varying positions and properties
    for (let i = 0; i < 20000; i++) {
        // Create a more natural distribution using spherical coordinates
        const radius = 1000 + Math.random() * 1000; // Stars at varying distances
        const theta = Math.random() * Math.PI * 2; // Random angle around the sphere
        const phi = Math.acos(2 * Math.random() - 1); // Random angle from the pole

        // Convert spherical to Cartesian coordinates
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        starVertices.push(x, y, z);

        // Add some color variation
        const color = new THREE.Color();
        const hue = 0.6 + Math.random() * 0.1; // Slight blue tint
        const saturation = 0.1 + Math.random() * 0.2; // Low saturation
        const lightness = 0.7 + Math.random() * 0.3; // High lightness
        color.setHSL(hue, saturation, lightness);
        starColors.push(color.r, color.g, color.b);

        // Varying star sizes
        starSizes.push(0.5 + Math.random() * 2);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Add twinkling animation
    function animateStars() {
        const positions = starGeometry.attributes.position.array;
        const sizes = starGeometry.attributes.size.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Subtle position changes for twinkling effect
            positions[i] += (Math.random() - 0.5) * 0.1;
            positions[i + 1] += (Math.random() - 0.5) * 0.1;
            positions[i + 2] += (Math.random() - 0.5) * 0.1;
            
            // Size variation for twinkling
            sizes[i / 3] = 0.5 + Math.random() * 2;
        }
        
        starGeometry.attributes.position.needsUpdate = true;
        starGeometry.attributes.size.needsUpdate = true;
    }

    // Add star animation to the main animation loop
    const originalAnimate = animate;
    animate = function() {
        animateStars();
        originalAnimate();
    };
}

// Create the Earth globe with improved materials
function createGlobe() {
    // Create globe geometry with more segments for smoother appearance
    const geometry = new THREE.SphereGeometry(globeRadius, 64, 64);
    
    // Create enhanced material with atmospheric glow
    const material = new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg'),
        bumpMap: new THREE.TextureLoader().load('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png'),
        bumpScale: 0.5,
        specularMap: new THREE.TextureLoader().load('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-specular.jpg'),
        specular: new THREE.Color(0x333333),
        shininess: 5,
        transparent: true,
        opacity: 0.95
    });

    // Create the globe mesh
    globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Add atmospheric glow
    const glowGeometry = new THREE.SphereGeometry(globeRadius * 1.02, 64, 64);
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            glowColor: { value: new THREE.Color(0x00a8ff) },
            viewVector: { value: camera.position }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPositionNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            varying vec3 vNormal;
            varying vec3 vPositionNormal;
            void main() {
                float intensity = pow(0.7 - dot(vNormal, vPositionNormal), 2.0);
                gl_FragColor = vec4(glowColor, intensity);
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);
    animationState.glow = glow;
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle globe click to select location
function onGlobeClick(event) {
    // Get mouse coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Cast ray from camera through mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersection with globe
    const intersects = raycaster.intersectObject(globe);
    
    if (intersects.length > 0) {
        const point = intersects[0].point;
        
        // Convert point to latitude and longitude
        const lat = 90 - (Math.acos(point.y / globeRadius) * 180 / Math.PI);
        const lng = ((270 + (Math.atan2(point.x, point.z) * 180 / Math.PI)) % 360) - 180;
        
        // Get weather data for the selected location
        getWeatherData(lat, lng);
        
        // Clear existing markers properly before adding new ones
        clearWeatherMarkers();
        
        // Add marker at the selected location
        addWeatherMarker(point);
        
        // Save current location
        currentLocation = { lat, lng, name: 'Selected Location' };
    }
}

// Convert latitude and longitude to 3D position
function latLngToCartesian(lat, lng) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    const x = -globeRadius * Math.sin(phi) * Math.cos(theta);
    const y = globeRadius * Math.cos(phi);
    const z = globeRadius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z);
}

// Add weather marker at the selected location
function addWeatherMarker(position) {
    // Remove existing markers
    weatherMarkers.forEach(marker => scene.remove(marker));
    weatherMarkers.length = 0;
    
    // Remove existing weather effects
    clearWeatherEffects();
    
    // Store the original position for animation reference
    const originalPosition = position.clone().normalize().multiplyScalar(globeRadius + 1);
    
    // Create pin group
    const pinGroup = new THREE.Group();
    
    // Calculate the normal vector (direction from globe center to pin position)
    const normal = originalPosition.clone().normalize();
    
    // Create pin head (sphere with slight flattening)
    const headGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff4500,
        transparent: true,
        opacity: 0.95,
        shininess: 100,
        specular: 0xffffff
    });
    const pinHead = new THREE.Mesh(headGeometry, headMaterial);
    pinHead.scale.set(1, 0.5, 1); // Flatten the sphere
    pinHead.position.y = 0.8; // Position above the pin body
    pinGroup.add(pinHead);
    
    // Create pin body (cylinder with rounded top)
    const bodyGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 16);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff4500,
        transparent: true,
        opacity: 0.95,
        shininess: 100,
        specular: 0xffffff
    });
    const pinBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    pinBody.position.y = 0; // Position the body
    pinGroup.add(pinBody);
    
    // Create pin point (cone)
    const pointGeometry = new THREE.ConeGeometry(0.05, 0.3, 16);
    const pointMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff4500,
        transparent: true,
        opacity: 0.95,
        shininess: 100,
        specular: 0xffffff
    });
    const pinPoint = new THREE.Mesh(pointGeometry, pointMaterial);
    pinPoint.position.y = -0.9; // Position at the bottom
    pinPoint.rotation.x = Math.PI; // Rotate to point downward
    pinGroup.add(pinPoint);
    
    // Create pin shadow (slightly larger cone)
    const shadowGeometry = new THREE.ConeGeometry(0.1, 0.05, 16);
    const shadowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x000000,
        transparent: true,
        opacity: 0.2
    });
    const pinShadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    pinShadow.position.y = -1.1; // Position at the bottom
    pinGroup.add(pinShadow);
    
    // Position and orient the pin group
    pinGroup.position.copy(originalPosition);
    
    // Make the pin point towards the globe's center
    pinGroup.lookAt(0, 0, 0);
    
    // Add pin to the scene and tracking array
    scene.add(pinGroup);
    weatherMarkers.push(pinGroup);
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(originalPosition);
    scene.add(glow);
    weatherMarkers.push(glow);
    
    // Add pulse effect
    const pulseAnimation = createPulseEffect(originalPosition.clone());
    scene.add(pulseAnimation);
    weatherMarkers.push(pulseAnimation);
    
    // Add hover effect
    const hoverGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const hoverMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 0.1
    });
    const hoverEffect = new THREE.Mesh(hoverGeometry, hoverMaterial);
    hoverEffect.position.copy(originalPosition);
    scene.add(hoverEffect);
    weatherMarkers.push(hoverEffect);
    
    // Animate hover effect with smoother animation
    const animateHover = () => {
        const scale = 1 + Math.sin(Date.now() * 0.001) * 0.05; // Slower, smaller pulse
        hoverEffect.scale.set(scale, scale, scale);
        glow.scale.set(scale, scale, scale);
        requestAnimationFrame(animateHover);
    };
    animateHover();
    
    // Add entrance animation
    pinGroup.scale.set(0, 0, 0);
    glow.scale.set(0, 0, 0);
    gsap.to([pinGroup.scale, glow.scale], {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.5,
        ease: "elastic.out(1, 0.5)"
    });
    
    // Add floating animation
    const markerObjects = [pinGroup, glow, hoverEffect, pulseAnimation];
    
    // Create a proper animation loop that won't drift
    const floatAnimationId = { id: null };
    
    const animateFloat = () => {
        const time = Date.now() * 0.001;
        const floatAmount = Math.sin(time) * 0.05; // Reduced float amount
        
        markerObjects.forEach(obj => {
            // Reset to original position first, then add the float amount
            obj.position.copy(originalPosition.clone());
            // Only offset in the direction of the original position vector
            const floatOffset = originalPosition.clone().normalize().multiplyScalar(floatAmount);
            obj.position.add(floatOffset);
            
            // Update pin orientation to always point towards globe center
            if (obj === pinGroup) {
                obj.lookAt(0, 0, 0);
            }
        });
        
        floatAnimationId.id = requestAnimationFrame(animateFloat);
    };
    
    animateFloat();
    
    // Store animation ID for cleanup
    pinGroup.userData.floatAnimationId = floatAnimationId;
}

// Create pulse effect with smaller size and smoother animation
function createPulseEffect(position) {
    const geometry = new THREE.SphereGeometry(1, 16, 16);
    const material = new THREE.MeshBasicMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });
    
    const pulse = new THREE.Mesh(geometry, material);
    pulse.position.copy(position);
    pulse.scale.set(1, 1, 1);
    
    // Animate the pulse with smoother animation
    const animatePulse = function() {
        gsap.to(pulse.scale, {
            x: 3,
            y: 3,
            z: 3,
            duration: 1.5,
            ease: "power2.out",
            onComplete: function() {
                gsap.to(material, {
                    opacity: 0,
                    duration: 0.5,
                    onComplete: function() {
                        pulse.scale.set(1, 1, 1);
                        material.opacity = 1;
                        animatePulse();
                    }
                });
            }
        });
    };
    
    animatePulse();
    return pulse;
}

// Create visual weather effects based on weather type
function createWeatherEffect(position, weatherType) {
    // Position slightly above the globe
    const effectPosition = position.clone().normalize().multiplyScalar(globeRadius + 10);
    
    switch(weatherType) {
        case 'Rain':
        case 'Drizzle':
            createRainEffect(effectPosition);
            break;
        case 'Snow':
            createSnowEffect(effectPosition);
            break;
        case 'Thunderstorm':
            createLightningEffect(effectPosition);
            break;
        case 'Clouds':
            createCloudEffect(effectPosition);
            break;
        // Add more weather types as needed
    }
}

// Create rain effect
function createRainEffect(position) {
    const particleCount = 500;
    const radius = 20;
    
    // Create particles
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * radius;
        
        positions[i3] = position.x + Math.cos(angle) * r;
        positions[i3 + 1] = position.y + Math.random() * 20 - 40; // Spread vertically
        positions[i3 + 2] = position.z + Math.sin(angle) * r;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create material
    const material = new THREE.PointsMaterial({
        color: 0x4fc3f7,
        size: 0.5,
        transparent: true,
        opacity: 0.7
    });
    
    // Create rain system
    const rain = new THREE.Points(particles, material);
    scene.add(rain);
    weatherEffects.push(rain);
    
    // Animate rain
    const positionArray = particles.attributes.position.array;
    const animateRain = function() {
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Move rain down
            positionArray[i3 + 1] -= 0.5;
            
            // Reset particles that go too low
            if (positionArray[i3 + 1] < position.y - 40) {
                positionArray[i3 + 1] = position.y + 20;
            }
        }
        
        particles.attributes.position.needsUpdate = true;
    };
    
    // Add rain animation to main loop
    const originalAnimate = animate;
    animate = function() {
        animateRain();
        originalAnimate();
    };
}

// Create snow effect
function createSnowEffect(position) {
    const particleCount = 300;
    const radius = 20;
    
    // Create particles
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * radius;
        
        positions[i3] = position.x + Math.cos(angle) * r;
        positions[i3 + 1] = position.y + Math.random() * 20 - 20;
        positions[i3 + 2] = position.z + Math.sin(angle) * r;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create material
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1,
        transparent: true,
        opacity: 0.8
    });
    
    // Create snow system
    const snow = new THREE.Points(particles, material);
    scene.add(snow);
    weatherEffects.push(snow);
    
    // Animate snow
    const positionArray = particles.attributes.position.array;
    const snowSpeeds = new Float32Array(particleCount).map(() => Math.random() * 0.2 + 0.1);
    
    const animateSnow = function() {
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Move snow down and add some horizontal movement
            positionArray[i3] += Math.sin(Date.now() * 0.001 + i) * 0.05;
            positionArray[i3 + 1] -= snowSpeeds[i];
            positionArray[i3 + 2] += Math.cos(Date.now() * 0.0015 + i) * 0.05;
            
            // Reset particles that go too low
            if (positionArray[i3 + 1] < position.y - 20) {
                positionArray[i3 + 1] = position.y + 20;
            }
        }
        
        particles.attributes.position.needsUpdate = true;
    };
    
    // Add snow animation to main loop
    const originalAnimate = animate;
    animate = function() {
        animateSnow();
        originalAnimate();
    };
}

// Create cloud effect
function createCloudEffect(position) {
    const cloudTexture = new THREE.TextureLoader().load('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-clouds.png');
    
    // Create cloud particles
    const cloudCount = 10;
    const clouds = [];
    
    for (let i = 0; i < cloudCount; i++) {
        const size = Math.random() * 10 + 5;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 10 + 10;
        
        const cloudGeometry = new THREE.PlaneGeometry(size, size);
        const cloudMaterial = new THREE.MeshBasicMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.7
        });
        
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        
        // Position clouds
        cloud.position.set(
            position.x + Math.cos(angle) * distance,
            position.y + Math.random() * 5,
            position.z + Math.sin(angle) * distance
        );
        
        // Make clouds always face the camera
        cloud.lookAt(camera.position);
        
        scene.add(cloud);
        clouds.push(cloud);
        weatherEffects.push(cloud);
    }
    
    // Animate clouds
    const animateClouds = function() {
        clouds.forEach((cloud, index) => {
            cloud.rotation.z += 0.001;
            cloud.position.x += Math.sin(Date.now() * 0.0005 + index) * 0.05;
            cloud.position.z += Math.cos(Date.now() * 0.0005 + index) * 0.05;
            cloud.lookAt(camera.position);
        });
    };
    
    // Add cloud animation to main loop
    const originalAnimate = animate;
    animate = function() {
        animateClouds();
        originalAnimate();
    };
}

// Create lightning effect
function createLightningEffect(position) {
    // Lightning flash
    const flashLight = new THREE.PointLight(0xffffff, 10, 100);
    flashLight.position.copy(position);
    scene.add(flashLight);
    weatherEffects.push(flashLight);
    
    // Animate lightning
    const animateLightning = function() {
        // Random flashes
        if (Math.random() < 0.01) {
            flashLight.intensity = 10;
            setTimeout(() => {
                flashLight.intensity = 0;
            }, 100);
        }
    };
    
    // Add lightning animation to main loop
    const originalAnimate = animate;
    animate = function() {
        animateLightning();
        originalAnimate();
    };
}

// Clear all weather effects
function clearWeatherEffects() {
    weatherEffects.forEach(effect => scene.remove(effect));
    weatherEffects = [];
}

// Get weather data for a location
function getWeatherData(lat, lng) {
    // Check if API key is set
    if (API_KEY === 'YOUR_OPENWEATHER_API_KEY') {
        document.getElementById('weather-details').innerHTML = `
            <div class="error-message">
                <p>Please set up your OpenWeather API key in the configuration.</p>
                <p>Get a free API key from <a href="https://openweathermap.org/api" target="_blank">OpenWeatherMap</a></p>
            </div>
        `;
        return;
    }
    
    // Get current weather
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${API_KEY}`;
    
    fetch(currentWeatherUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Update weather display
            updateWeatherDisplay(data);
            
            // Add visual weather effect
            const weatherType = data.weather[0].main;
            const position = latLngToCartesian(lat, lng);
            createWeatherEffect(position, weatherType);
            
            // Get forecast data
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${API_KEY}`;
            
            return fetch(forecastUrl);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(forecastData => {
            // Update forecast display
            updateForecastDisplay(forecastData);
            
            // Update current location name if it was a search
            if (currentLocation && currentLocation.name === 'Selected Location' && forecastData.city) {
                currentLocation.name = forecastData.city.name;
            }
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            
            // Show appropriate error message
            let errorMessage = 'Unable to fetch weather data. ';
            if (error.message.includes('401')) {
                errorMessage += 'Invalid API key. Please check your configuration.';
            } else if (error.message.includes('404')) {
                errorMessage += 'Location not found.';
            } else {
                errorMessage += 'Please try again later.';
            }
            
            document.getElementById('weather-details').innerHTML = `
                <div class="error-message">
                    <p>${errorMessage}</p>
                </div>
            `;
        });
}

// Update weather display with fetched data
function updateWeatherDisplay(data) {
    const cityName = data.name;
    const country = data.sys.country;
    const temperature = data.main.temp;
    const feelsLike = data.main.feels_like;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    
    // Create weather icon URL
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    
    // Update the weather info container
    document.getElementById('weather-details').innerHTML = `
        <div class="location-info">
            <h3>${cityName}, ${country}</h3>
            <img src="${iconUrl}" alt="${description}" class="weather-icon">
            <p class="weather-description">${description}</p>
        </div>
        <div class="weather-grid">
            <div class="weather-item">
                <i class="fas fa-temperature-high"></i>
                <p>${temperature.toFixed(1)}°C</p>
            </div>
            <div class="weather-item">
                <i class="fas fa-thermometer-half"></i>
                <p>Feels: ${feelsLike.toFixed(1)}°C</p>
            </div>
            <div class="weather-item">
                <i class="fas fa-tint"></i>
                <p>Humidity: ${humidity}%</p>
            </div>
            <div class="weather-item">
                <i class="fas fa-wind"></i>
                <p>Wind: ${windSpeed} m/s</p>
            </div>
        </div>
    `;
    
    // Update detailed metrics content
    document.getElementById('metrics-content').innerHTML = `
        <div class="metrics-grid">
            <div class="metric-item">
                <p>Pressure</p>
                <p>${data.main.pressure} hPa</p>
            </div>
            <div class="metric-item">
                <p>Visibility</p>
                <p>${(data.visibility / 1000).toFixed(1)} km</p>
            </div>
            <div class="metric-item">
                <p>Cloudiness</p>
                <p>${data.clouds.all}%</p>
            </div>
            <div class="metric-item">
                <p>Sunrise</p>
                <p>${new Date(data.sys.sunrise * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
            <div class="metric-item">
                <p>Sunset</p>
                <p>${new Date(data.sys.sunset * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
        </div>
    `;
    
    // Show the forecast container
    document.getElementById('forecast-container').classList.remove('hidden');
}

// Update forecast display with fetched data
function updateForecastDisplay(data) {
    const forecastDiv = document.getElementById('forecast-timeline');
    forecastDiv.innerHTML = '';
    
    // Group forecast by day (every 8 entries = new day, as API returns forecast every 3 hours)
    const dailyForecasts = [];
    for (let i = 0; i < data.list.length; i += 8) {
        if (data.list[i]) {
            dailyForecasts.push(data.list[i]);
        }
    }
    
    // Create forecast items (limit to 5 days)
    dailyForecasts.slice(0, 5).forEach((forecast, index) => {
        const date = new Date(forecast.dt * 1000);
        const dayName = date.toLocaleDateString([], {weekday: 'short'});
        const temp = forecast.main.temp;
        const weatherMain = forecast.weather[0].main;
        const weatherIcon = getWeatherIconClass(weatherMain);
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item' + (index === 0 ? ' active' : '');
        forecastItem.innerHTML = `
            <div class="forecast-date">${dayName}</div>
            <i class="${weatherIcon} forecast-icon"></i>
            <div class="forecast-temp">${temp.toFixed(1)}°C</div>
        `;
        
        // Add click event to forecast item
        forecastItem.addEventListener('click', () => {
            // Remove active class from all items
            document.querySelectorAll('.forecast-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to clicked item
            forecastItem.classList.add('active');
            
            // Show the forecast details
            showForecastDetails(data.list, index);
        });
        
        forecastDiv.appendChild(forecastItem);
    });
    
    // Show first day's details by default
    showForecastDetails(data.list, 0);
}

// Show details for a particular forecast day
function showForecastDetails(forecastList, dayIndex) {
    // Each day has 8 entries (3-hour intervals)
    const startIndex = dayIndex * 8;
    const dayForecasts = forecastList.slice(startIndex, startIndex + 8);
    
    // TODO: Show more detailed forecast info if needed
    console.log('Detailed forecast for selected day:', dayForecasts);
}

// Get appropriate weather icon class based on weather type
function getWeatherIconClass(weatherType) {
    switch(weatherType) {
        case 'Clear':
            return 'fas fa-sun';
        case 'Clouds':
            return 'fas fa-cloud';
        case 'Rain':
        case 'Drizzle':
            return 'fas fa-cloud-rain';
        case 'Thunderstorm':
            return 'fas fa-bolt';
        case 'Snow':
            return 'fas fa-snowflake';
        case 'Mist':
        case 'Fog':
        case 'Haze':
            return 'fas fa-smog';
        default:
            return 'fas fa-cloud-sun';
    }
}

// Search for a location by name
function searchLocation() {
    const locationInput = document.getElementById('location-search').value;
    if (!locationInput) return;
    
    // Show loading state
    document.getElementById('weather-details').innerHTML = 'Searching location...';
    
    // Use Open-Meteo Geocoding API (free, no API key required)
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationInput)}&count=1`)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                const lat = result.latitude;
                const lng = result.longitude;
                
                // Update current location
                currentLocation = {
                    lat,
                    lng,
                    name: result.name
                };
                
                // Get weather for the location
                getWeatherData(lat, lng);
                
                // Add marker and move camera to position
                const position = latLngToCartesian(lat, lng);
                addWeatherMarker(position);
                
                // Animate camera to new position
                const cameraPosition = position.clone().normalize().multiplyScalar(250);
                gsap.to(camera.position, {
                    x: cameraPosition.x,
                    y: cameraPosition.y,
                    z: cameraPosition.z,
                    duration: 1,
                });
            } else {
                document.getElementById('weather-details').innerHTML = 'Location not found';
            }
        })
        .catch(error => {
            console.error('Error searching location:', error);
            document.getElementById('weather-details').innerHTML = 'Error searching location';
        });
}

// Globe control functions
function resetView() {
    gsap.to(camera.position, {
        x: 0,
        y: 0,
        z: 200,
        duration: 1
    });
    
    gsap.to(controls.target, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1
    });
}

function zoomIn() {
    if (camera.position.length() > controls.minDistance + 10) {
        gsap.to(camera.position, {
            x: camera.position.x * 0.8,
            y: camera.position.y * 0.8,
            z: camera.position.z * 0.8,
            duration: 0.5,
            ease: "power2.out"
        });
    }
}

function zoomOut() {
    if (camera.position.length() < controls.maxDistance - 10) {
        gsap.to(camera.position, {
            x: camera.position.x * 1.2,
            y: camera.position.y * 1.2,
            z: camera.position.z * 1.2,
            duration: 0.5,
            ease: "power2.out"
        });
    }
}

function toggleDayNight() {
    isDayMode = !isDayMode;
    
    const button = document.getElementById('toggle-day-night');
    button.classList.toggle('active');
    
    if (isDayMode) {
        button.innerHTML = '<i class="fas fa-moon"></i>';
        scene.background = new THREE.Color(0x000000);
        
        // Brighten lights
        scene.traverse(object => {
            if (object.isLight && object !== sunLight) {
                gsap.to(object, { intensity: object.userData.dayIntensity || object.intensity * 2, duration: 1 });
            }
        });
    } else {
        button.innerHTML = '<i class="fas fa-sun"></i>';
        scene.background = new THREE.Color(0x000010);
        
        // Dim lights
        scene.traverse(object => {
            if (object.isLight && object !== sunLight) {
                // Store original intensity if not already stored
                if (!object.userData.dayIntensity) {
                    object.userData.dayIntensity = object.intensity;
                }
                gsap.to(object, { intensity: object.intensity * 0.5, duration: 1 });
            }
        });
    }
}

// Toggle additional metrics display
function toggleMetrics() {
    const metricsSection = document.getElementById('additional-metrics');
    const toggleButton = document.getElementById('toggle-metrics');
    
    metricsSection.classList.toggle('hidden');
    toggleButton.classList.toggle('rotated');
    
    if (metricsSection.classList.contains('hidden')) {
        toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
        toggleButton.title = 'Show More';
    } else {
        toggleButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
        toggleButton.title = 'Show Less';
    }
}

// Bookmarks functionality
function toggleBookmarks() {
    document.getElementById('bookmarks-content').classList.toggle('show');
}

function saveCurrentLocation() {
    if (!currentLocation) {
        alert('Please select a location first');
        return;
    }
    
    // Check if location is already bookmarked
    const exists = bookmarkedLocations.some(loc => 
        loc.lat === currentLocation.lat && 
        loc.lng === currentLocation.lng
    );
    
    if (!exists) {
        bookmarkedLocations.push({
            name: currentLocation.name,
            lat: currentLocation.lat,
            lng: currentLocation.lng
        });
        
        // Save to localStorage
        localStorage.setItem('weatherGlobeBookmarks', JSON.stringify(bookmarkedLocations));
        
        // Update bookmarks display
        renderBookmarks();
    }
    
    // Hide dropdown
    document.getElementById('bookmarks-content').classList.remove('show');
}

function loadBookmarks() {
    const savedBookmarks = localStorage.getItem('weatherGlobeBookmarks');
    if (savedBookmarks) {
        bookmarkedLocations = JSON.parse(savedBookmarks);
        renderBookmarks();
    }
}

function renderBookmarks() {
    const container = document.getElementById('saved-locations');
    
    if (bookmarkedLocations.length === 0) {
        container.innerHTML = '<p>No saved locations</p>';
        return;
    }
    
    container.innerHTML = '';
    bookmarkedLocations.forEach((location, index) => {
        const item = document.createElement('div');
        item.className = 'saved-location-item';
        
        item.innerHTML = `
            <span>${location.name}</span>
            <button class="remove-bookmark" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add click event to load this location
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-bookmark')) {
                loadBookmarkedLocation(location);
            }
        });
        
        container.appendChild(item);
    });
    
    // Add remove bookmark event listeners
    document.querySelectorAll('.remove-bookmark').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(button.dataset.index);
            removeBookmark(index);
        });
    });
}

function loadBookmarkedLocation(location) {
    // Set as current location
    currentLocation = { ...location };
    
    // Get weather data and update display
    getWeatherData(location.lat, location.lng);
    
    // Add marker and move camera
    const position = latLngToCartesian(location.lat, location.lng);
    addWeatherMarker(position);
    
    // Animate camera to position
    const cameraPosition = position.clone().normalize().multiplyScalar(250);
    gsap.to(camera.position, {
        x: cameraPosition.x,
        y: cameraPosition.y,
        z: cameraPosition.z,
        duration: 1
    });
    
    // Hide dropdown
    document.getElementById('bookmarks-content').classList.remove('show');
}

function removeBookmark(index) {
    bookmarkedLocations.splice(index, 1);
    
    // Save to localStorage
    localStorage.setItem('weatherGlobeBookmarks', JSON.stringify(bookmarkedLocations));
    
    // Update bookmarks display
    renderBookmarks();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls with current rotation speed
    controls.autoRotateSpeed = 0.2 * rotationSpeed;
    
    controls.update();
    renderer.render(scene, camera);
    
    // Update weather effects
    updateAnimations();
}

// Update marker size based on zoom level with smoother transitions
function updateMarkerSize() {
    const distance = camera.position.length();
    const baseSize = 1; // Base size
    const minSize = 0.8; // Increased minimum size
    const maxSize = 3; // Increased maximum size
    
    // Calculate size based on distance (inverse relationship)
    const size = Math.max(minSize, Math.min(maxSize, baseSize * (300 / distance)));
    
    weatherMarkers.forEach(marker => {
        if (marker instanceof THREE.Group || marker.geometry instanceof THREE.SphereGeometry) {
            gsap.to(marker.scale, {
                x: size,
                y: size,
                z: size,
                duration: 0.3,
                ease: "power2.out"
            });
        }
    });
}

// Add a cleanup function before removing markers
function clearWeatherMarkers() {
    weatherMarkers.forEach(marker => {
        // Cancel any running animations
        if (marker.userData && marker.userData.floatAnimationId) {
            cancelAnimationFrame(marker.userData.floatAnimationId.id);
        }
        scene.remove(marker);
    });
    weatherMarkers.length = 0;
}

// Update animations
function updateAnimations() {
    // Update glow effect
    if (animationState.glow) {
        const time = Date.now() * 0.001;
        const pulse = Math.sin(time * animationState.pulseSpeed) * animationState.pulseIntensity + 1.0;
        animationState.glow.material.uniforms.glowColor.value.setRGB(
            0.0 + pulse * 0.1,
            0.66 + pulse * 0.1,
            1.0 + pulse * 0.1
        );
    }
}

// Initialize the application
window.addEventListener('load', function() {
    init();
});