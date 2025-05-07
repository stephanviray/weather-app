document.addEventListener('DOMContentLoaded', () => {
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const chatInput = document.getElementById('chat-input');
    const sendMessage = document.getElementById('send-message');
    const chatMessages = document.getElementById('chat-messages');
    const startLocation = document.getElementById('start-location');
    const endLocation = document.getElementById('end-location');
    const getTravelGuide = document.getElementById('get-travel-guide');
    const travelRoute = document.getElementById('travel-route');
    const routeVisualization = document.getElementById('route-visualization');
    const routeWeatherInfo = document.getElementById('route-weather-info');
    const weatherRouteWindow = document.getElementById('weather-route-window');
    const closeWeatherRoute = document.getElementById('close-weather-route');
    const weatherRouteHeader = weatherRouteWindow.querySelector('.weather-route-header');

    // Dragging functionality
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    function dragStart(e) {
        if (e.type === "touchstart") {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        if (e.target === weatherRouteHeader) {
            isDragging = true;
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();

            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, weatherRouteWindow);
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    // Add touch and mouse event listeners
    weatherRouteHeader.addEventListener("touchstart", dragStart, false);
    weatherRouteHeader.addEventListener("touchend", dragEnd, false);
    weatherRouteHeader.addEventListener("touchmove", drag, false);

    weatherRouteHeader.addEventListener("mousedown", dragStart, false);
    document.addEventListener("mousemove", drag, false);
    document.addEventListener("mouseup", dragEnd, false);

    // Reference to the existing globe and scene
    let scene, globe, camera, globeRadius = 100;
    let isInitialized = false;

    // Initialize the scene and globe
    function initializeScene() {
        console.log('Initializing scene...');
        console.log('Window objects:', {
            scene: window.scene,
            globe: window.globe,
            camera: window.camera,
            API_KEY: window.API_KEY
        });

        if (window.scene && window.globe && window.camera) {
            scene = window.scene;
            globe = window.globe;
            camera = window.camera;
            globeRadius = window.globeRadius || 100;
            isInitialized = true;
            console.log('Scene initialized successfully');
            return true;
        }
        console.log('Scene not ready yet');
        return false;
    }

    // Toggle chat window visibility
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
        if (!chatWindow.classList.contains('hidden')) {
            chatInput.focus();
        }
    });

    closeChat.addEventListener('click', () => {
        chatWindow.classList.add('hidden');
    });

    // Add close handler for weather route window
    closeWeatherRoute.addEventListener('click', () => {
        weatherRouteWindow.classList.add('hidden');
        weatherRouteWindow.classList.remove('visible');
        
        // Restart globe rotation
        if (window.controls) {
            window.controls.autoRotate = true;
        }
    });

    // Handle travel guide request
    getTravelGuide.addEventListener('click', async () => {
        try {
            const startInputValue = startLocation.value.trim();
            const endInputValue = endLocation.value.trim();
            
            if (!startInputValue || !endInputValue) {
                addMessage("Please enter both starting location and destination.", 'bot');
                return;
            }
            
            // Show loading
            addMessage("Fetching travel guide and weather information...", 'bot');
            
            // Initialize scene if not already done
            if (!isInitialized) {
                console.log('Waiting for scene initialization...');
                await new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = 50; // 5 seconds max
                    const checkScene = setInterval(() => {
                        attempts++;
                        if (initializeScene()) {
                            clearInterval(checkScene);
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkScene);
                            reject(new Error('Scene initialization timeout'));
                        }
                    }, 100);
                });
            }
            
            // Stop globe rotation
            if (window.controls) {
                window.controls.autoRotate = false;
            }
            
            // Get coordinates for both locations
            const startCoords = await getCoordinates(startInputValue);
            const endCoords = await getCoordinates(endInputValue);
            
            if (!startCoords || !endCoords) {
                addMessage("Could not find one or both locations. Please check the names and try again.", 'bot');
                return;
            }
            
            // Show the route container
            document.getElementById('travel-route').classList.remove('hidden');
            
            // Visualize the route on the globe
            const visualizationSuccess = visualizeRoute(startCoords, endCoords);
            
            if (!visualizationSuccess) {
                throw new Error('Failed to visualize route');
            }
            
            // Get weather data along the route
            const weatherInfo = await getRouteWeather(startCoords, endCoords);
            
            // Display the weather information
            displayRouteWeather(weatherInfo);
            
            // Create real-time update interval
            if (window.routeWeatherInterval) {
                clearInterval(window.routeWeatherInterval);
            }
            
            // Update weather every 5 minutes
            window.routeWeatherInterval = setInterval(async () => {
                try {
                    console.log('Updating route weather...');
                    const updatedWeatherInfo = await getRouteWeather(startCoords, endCoords);
                    displayRouteWeather(updatedWeatherInfo);
                } catch (error) {
                    console.error('Error updating route weather:', error);
                }
            }, 300000); // 5 minutes
            
            // Provide summary to user in chat
            let safetyEmoji = '✅';
            if (weatherInfo.safety.status === 'warning') safetyEmoji = '⚠️';
            if (weatherInfo.safety.status === 'danger') safetyEmoji = '🚫';
            
            const responseMessage = `
Travel guide from ${startInputValue} to ${endInputValue} is ready!

${safetyEmoji} ${weatherInfo.safety.message}

Starting point: ${weatherInfo.start.temp}°C, ${weatherInfo.start.description}
Destination: ${weatherInfo.end.temp}°C, ${weatherInfo.end.description}
Expected on arrival: ${weatherInfo.expected.temp}°C, ${weatherInfo.expected.description}

View the detailed guide in the travel panel.
            `;
            
            addMessage(responseMessage, 'bot');
            
        } catch (error) {
            console.error('Error creating travel guide:', error);
            addMessage("Sorry, I couldn't create a travel guide for that route. Please check your locations and try again.", 'bot');
        }
    });

    // Get coordinates for a location
    async function getCoordinates(location) {
        try {
            // Get the API key from the main.js file
            const API_KEY = window.API_KEY || 'ebdd281e718392cab0ed58d3111c8612';
            
            // First try direct geocoding
            const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${API_KEY}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                return {
                    lat: data[0].lat,
                    lng: data[0].lon,
                    name: data[0].name,
                    country: data[0].country
                };
            }

            // If direct geocoding fails, try reverse geocoding with a fallback location
            const fallbackResponse = await fetch(`https://api.openweathermap.org/geo/1.0/zip?zip=${encodeURIComponent(location)}&appid=${API_KEY}`);
            
            if (!fallbackResponse.ok) {
                throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
            }
            
            const fallbackData = await fallbackResponse.json();
            
            if (fallbackData && fallbackData.lat && fallbackData.lon) {
                return {
                    lat: fallbackData.lat,
                    lng: fallbackData.lon,
                    name: fallbackData.name,
                    country: fallbackData.country
                };
            }

            // If both methods fail, try to parse the input as coordinates
            const coords = location.split(',').map(coord => parseFloat(coord.trim()));
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                return {
                    lat: coords[0],
                    lng: coords[1],
                    name: location,
                    country: 'Unknown'
                };
            }

            console.error('Location not found:', location);
            return null;
        } catch (error) {
            console.error('Error getting coordinates:', error);
            return null;
        }
    }

    // Visualize route on the globe
    function visualizeRoute(startCoords, endCoords) {
        if (!scene) {
            console.error('Scene not initialized');
            return false;
        }

        // Clean up previous route visualization
        if (window.cleanupRouteVisualization) {
            window.cleanupRouteVisualization();
            window.cleanupRouteVisualization = null;
        }

        // Clear previous route if it exists
        const existingRoute = scene.getObjectByName('travelRoute');
        if (existingRoute) {
            scene.remove(existingRoute);
        }

        // Clear previous markers
        const existingMarkers = scene.children.filter(child => child.name && child.name.startsWith('marker_'));
        existingMarkers.forEach(marker => scene.remove(marker));

        // Clear previous travel dot
        const existingTravelDot = scene.getObjectByName('travelDot');
        if (existingTravelDot) {
            scene.remove(existingTravelDot);
        }

        // Clear previous labels
        const existingLabels = document.querySelectorAll('.location-label');
        existingLabels.forEach(label => label.remove());

        // Clear previous travel labels
        const existingTravelLabels = document.querySelectorAll('.travel-label');
        existingTravelLabels.forEach(label => label.remove());

        try {
            // Convert start and end points to 3D vectors
            const start = latLngToCartesian(startCoords.lat, startCoords.lng);
            const end = latLngToCartesian(endCoords.lat, endCoords.lng);

            // Calculate the great circle path with more points for smoother curve
            const numPoints = 200; // Increased number of points
            const points = [];
            
            // Calculate the angle between start and end points
            const angle = start.angleTo(end);
            
            // Create interpolated points along the great circle
            for (let i = 0; i <= numPoints; i++) {
                const t = i / numPoints;
                
                // Use spherical interpolation (SLERP) for smooth curve
                const point = new THREE.Vector3();
                const omega = Math.acos(start.dot(end) / (start.length() * end.length()));
                
                if (omega !== 0) {
                    const sinOmega = Math.sin(omega);
                    const scale0 = Math.sin((1 - t) * omega) / sinOmega;
                    const scale1 = Math.sin(t * omega) / sinOmega;
                    
                    point.x = start.x * scale0 + end.x * scale1;
                    point.y = start.y * scale0 + end.y * scale1;
                    point.z = start.z * scale0 + end.z * scale1;
                    
                    // Normalize to keep point on globe surface
                    point.normalize().multiplyScalar(globeRadius + 0.2); // Slightly raised above surface
                    points.push(point);
                }
            }

            // Create enhanced route line
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial = new THREE.LineDashedMaterial({ 
                color: 0xff0000, // Changed to red
                linewidth: 3, // Increased line width for better visibility
                dashSize: 2, // Increased dash size
                gapSize: 1, // Adjusted gap size for better dash pattern
                opacity: 0.9, // Increased opacity
                transparent: true
            });

            const line = new THREE.Line(lineGeometry, lineMaterial);
            line.computeLineDistances(); // Required for dashed lines
            line.name = 'travelRoute';
            scene.add(line);

            // Create traveling dot
            const dotGeometry = new THREE.SphereGeometry(0.8, 16, 16);
            const dotMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffff00, // Yellow color
                transparent: true,
                opacity: 0.9
            });
            const travelDot = new THREE.Mesh(dotGeometry, dotMaterial);
            travelDot.name = 'travelDot';
            
            // Add glow effect to the dot
            const dotGlowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
            const dotGlowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.4,
                blending: THREE.AdditiveBlending
            });
            const dotGlow = new THREE.Mesh(dotGlowGeometry, dotGlowMaterial);
            dotGlow.scale.set(1.5, 1.5, 1.5);
            travelDot.add(dotGlow);

            // Create pulsing animation for the glow
            const pulseAnimation = gsap.to(dotGlow.scale, {
                x: 2,
                y: 2,
                z: 2,
                duration: 1,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut"
            });

            scene.add(travelDot);
            
            // Create and add travel label
            const travelLabelDiv = document.createElement('div');
            travelLabelDiv.className = 'travel-label';
            travelLabelDiv.textContent = 'Travelling';
            document.body.appendChild(travelLabelDiv);

            // Create walking animation effect
            let animationProgress = 0;
            const animationDuration = 3000; // 3 seconds
            const startTime = Date.now();

            const animateLine = () => {
                const currentTime = Date.now();
                const elapsed = currentTime - startTime;
                animationProgress = Math.min(elapsed / animationDuration, 1);
                
                // Calculate the visible portion of the line
                const totalLength = lineGeometry.attributes.position.count;
                const visiblePoints = Math.floor(totalLength * animationProgress);

                // Create a new geometry with only the visible points
                const visibleGeometry = new THREE.BufferGeometry();
                const positions = new Float32Array(visiblePoints * 3);
                
                for (let i = 0; i < visiblePoints; i++) {
                    positions[i * 3] = lineGeometry.attributes.position.array[i * 3];
                    positions[i * 3 + 1] = lineGeometry.attributes.position.array[i * 3 + 1];
                    positions[i * 3 + 2] = lineGeometry.attributes.position.array[i * 3 + 2];
                }

                visibleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                
                // Update the line geometry
                line.geometry = visibleGeometry;
                line.computeLineDistances();
                
                // Update traveling dot position
                if (visiblePoints > 0) {
                    // Get the last visible point to position the dot at the end of the visible line
                    const lastPointIndex = visiblePoints - 1;
                    const x = positions[lastPointIndex * 3];
                    const y = positions[lastPointIndex * 3 + 1];
                    const z = positions[lastPointIndex * 3 + 2];
                    
                    travelDot.position.set(x, y, z);
                    
                    // Position the travel label above the dot
                    const dotPosition = new THREE.Vector3(x, y, z);
                    dotPosition.normalize().multiplyScalar(globeRadius + 1); // Position slightly above globe surface
                    travelDot.position.copy(dotPosition);
                    
                    // Project the dot position to screen coordinates for the label
                    const vector = dotPosition.clone();
                    vector.project(camera);
                    
                    // Convert to screen coordinates
                    const labelX = (vector.x * 0.5 + 0.5) * window.innerWidth;
                    const labelY = -(vector.y * 0.5 - 0.5) * window.innerHeight;
                    
                    // Position the label
                    travelLabelDiv.style.left = `${labelX}px`;
                    travelLabelDiv.style.top = `${labelY}px`;
                    travelLabelDiv.style.opacity = '1';
                    
                    // Add pulsing effect to the dot
                    const pulseScale = 1 + 0.2 * Math.sin(Date.now() * 0.01);
                    dotGlow.scale.set(pulseScale, pulseScale, pulseScale);
                }
                
                if (animationProgress < 1) {
                    requestAnimationFrame(animateLine);
                } else {
                    // Animation complete - change label to destination name
                    travelLabelDiv.textContent = `${endCoords.name || 'Destination'} (${endCoords.country || 'Unknown'})`;
                    
                    // Final camera position after animation completes
                    const midPoint = new THREE.Vector3().addVectors(start, end).normalize();
                    const finalCameraPosition = midPoint.multiplyScalar(camera.position.length() * 1.0);
                    
                    // Final camera position with better view
                    gsap.to(camera.position, {
                        x: finalCameraPosition.x,
                        y: finalCameraPosition.y + 20, // Added vertical offset
                        z: finalCameraPosition.z,
                        duration: 1.5,
                        ease: "power2.inOut",
                        onUpdate: () => {
                            camera.lookAt(scene.position);
                            
                            // Keep updating label position after camera movement
                            const vector = travelDot.position.clone();
                            vector.project(camera);
                            
                            const labelX = (vector.x * 0.5 + 0.5) * window.innerWidth;
                            const labelY = -(vector.y * 0.5 - 0.5) * window.innerHeight;
                            
                            travelLabelDiv.style.left = `${labelX}px`;
                            travelLabelDiv.style.top = `${labelY}px`;
                        }
                    });
                }
            };

            // Start the animation
            animateLine();

            // Animate dot along the route
            const animateDot = () => {
                const progress = animationProgress;
                if (progress < 1) {
                    // Calculate position along the curve
                    const index = Math.floor(progress * (points.length - 1));
                    const nextIndex = Math.min(index + 1, points.length - 1);
                    const subProgress = (progress * (points.length - 1)) % 1;
                    
                    const currentPoint = points[index];
                    const nextPoint = points[nextIndex];
                    
                    // Interpolate between points
                    const position = currentPoint.clone().lerp(nextPoint, subProgress);
                    travelDot.position.copy(position);
                    
                    // Update label position
                    const vector = position.clone();
                    vector.project(camera);
                    
                    const labelX = (vector.x * 0.5 + 0.5) * window.innerWidth;
                    const labelY = -(vector.y * 0.5 - 0.5) * window.innerHeight;
                    
                    travelLabelDiv.style.left = `${labelX}px`;
                    travelLabelDiv.style.top = `${labelY}px`;
                    travelLabelDiv.style.opacity = '1';
                    
                    requestAnimationFrame(animateDot);
                }
            };

            // Start the dot animation
            animateDot();

            // Add markers for start and end points
            addLocationMarker(startCoords, `${startCoords.name || 'Start'} (${startCoords.country || 'Unknown'})`);
            
            // Don't add end marker visually (we have the travel dot that becomes the destination marker)
            // but still register it for reference
            const endPosition = latLngToCartesian(endCoords.lat, endCoords.lng);
            const endMarkerName = `marker_${endCoords.name || 'End'}`;
            
            // Add reference to the scene for cleanup later
            const endMarkerRef = new THREE.Object3D();
            endMarkerRef.position.copy(endPosition);
            endMarkerRef.name = endMarkerName;
            endMarkerRef.visible = false; // Keep it invisible
            scene.add(endMarkerRef);

            // Rotate the globe to show the full path
            const midPoint = new THREE.Vector3().addVectors(start, end).normalize();
            const targetPosition = midPoint.multiplyScalar(camera.position.length()* 0.1);
            gsap.to(camera.position, {
                duration: 1,
                x: targetPosition.x,
                y: targetPosition.y,
                z: targetPosition.z,
                onUpdate: () => {
                    camera.lookAt(scene.position);
                }
            });

            // Set up continuous update for the travel label position during any camera movement
            if (window.travelLabelUpdateInterval) {
                clearInterval(window.travelLabelUpdateInterval);
            }
            
            // Add camera controls update listener to keep label positioned correctly
            controls.addEventListener('change', updateTravelLabelPosition);
            
            // Function to update travel label position
            function updateTravelLabelPosition() {
                if (travelDot && travelLabelDiv && document.body.contains(travelLabelDiv)) {
                    const vector = travelDot.position.clone();
                    vector.project(camera);
                    
                    const labelX = (vector.x * 0.5 + 0.5) * window.innerWidth;
                    const labelY = -(vector.y * 0.5 - 0.5) * window.innerHeight;
                    
                    travelLabelDiv.style.left = `${labelX}px`;
                    travelLabelDiv.style.top = `${labelY}px`;
                }
            }
            
            window.travelLabelUpdateInterval = setInterval(() => {
                updateTravelLabelPosition();
            }, 100); // Update 10 times per second
            
            // Add cleanup function to remove event listener when route is cleared
            window.cleanupRouteVisualization = () => {
                controls.removeEventListener('change', updateTravelLabelPosition);
                clearInterval(window.travelLabelUpdateInterval);
            };

            return true;
        } catch (error) {
            console.error('Error visualizing route:', error);
            return false;
        }
    }

    // Convert lat/lng to Cartesian coordinates
    function latLngToCartesian(lat, lng) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        const radius = globeRadius;
        
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        return new THREE.Vector3(x, y, z).normalize().multiplyScalar(radius);
    }

    // Add marker to the globe
    function addLocationMarker(coords, label) {
        if (!scene || !camera) {
            console.error('Scene or camera not initialized');
            return;
        }

        try {
            const position = latLngToCartesian(coords.lat, coords.lng);
            
            // Create smaller marker
            const markerGeometry = new THREE.SphereGeometry(1, 16, 16);
            const markerMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff4500,
                transparent: true,
                opacity: 0.9
            });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.copy(position);
            marker.name = `marker_${label}`;
            scene.add(marker);

            // Add smaller glow effect
            const glowGeometry = new THREE.SphereGeometry(1.5, 32, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0,
                transparent: true,
                opacity: 0.4,
                blending: THREE.AdditiveBlending
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.copy(position);
            glow.name = `glow_${label}`;
            scene.add(glow);

            // Create and add label with enhanced visibility
            const labelDiv = document.createElement('div');
            labelDiv.className = 'location-label';
            labelDiv.textContent = label;
            document.body.appendChild(labelDiv);

            // Add floating animation with improved positioning
            const animateFloat = () => {
                const time = Date.now() * 0.001;
                const floatAmount = Math.sin(time) * 0.1;
                
                // Update marker and glow position
                const newPosition = position.clone();
                newPosition.normalize().multiplyScalar(globeRadius + 1);
                newPosition.y += floatAmount;
                marker.position.copy(newPosition);
                glow.position.copy(newPosition);
                
                // Calculate label position directly above the marker
                const labelPosition = newPosition.clone();
                labelPosition.normalize().multiplyScalar(globeRadius + 2); // Position just above the marker
                
                // Project the label position to screen coordinates
                const vector = labelPosition.clone();
                vector.project(camera);
                
                // Convert to screen coordinates
                const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
                const y = -(vector.y * 0.5 - 0.5) * window.innerHeight;
                
                // Check if the point is in front of the globe
                if (vector.z < 1) {
                    // Calculate visibility based on angle to camera
                    const dot = labelPosition.clone().normalize().dot(camera.position.clone().normalize());
                    const opacity = Math.pow((dot + 1) / 2, 0.8);
                    
                    // Only show label if it's facing the camera
                    if (dot > -0.2) {
                        labelDiv.style.opacity = Math.max(0.8, opacity).toString();
                        
                        // Scale based on distance to camera
                        const distance = camera.position.distanceTo(labelPosition);
                        const scale = Math.max(0.9, Math.min(1.2, 10000 / distance));
                        
                        // Position the label directly above the marker - removed any transition for immediate movement
                        labelDiv.style.cssText = `
                            position: absolute;
                            transform: translate(-50%, -50%) translate(${x}px,${y}px) scale(${scale});
                            z-index: 100;
                            pointer-events: none;
                            opacity: ${Math.max(0.8, opacity)};
                            display: block;
                            will-change: transform;
                        `;
                    } else {
                        labelDiv.style.display = 'none';
                    }
                } else {
                    labelDiv.style.display = 'none';
                }
                
                // Animate glow size
                const glowScale = 1 + Math.sin(time * 2) * 0.1;
                glow.scale.set(glowScale, glowScale, glowScale);
                
                requestAnimationFrame(animateFloat);
            };
            animateFloat();

            // Add entrance animation
            marker.scale.set(0, 0, 0);
            glow.scale.set(0, 0, 0);
            gsap.to([marker.scale, glow.scale], {
                x: 1,
                y: 1,
                z: 1,
                duration: 0.5,
                ease: "elastic.out(1, 0.5)"
            });

            // Fade in the label
            gsap.to(labelDiv, {
                opacity: 1,
                duration: 0.5,
                delay: 0.2
            });

        } catch (error) {
            console.error('Error adding location marker:', error);
            throw error;
        }
    }

    // Get weather information along the route
    async function getRouteWeather(startCoords, endCoords) {
        try {
            const API_KEY = window.API_KEY || 'ebdd281e718392cab0ed58d3111c8612';
            
            const startResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${startCoords.lat}&lon=${startCoords.lng}&appid=${API_KEY}&units=metric`);
            const endResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${endCoords.lat}&lon=${endCoords.lng}&appid=${API_KEY}&units=metric`);
            const startForecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${startCoords.lat}&lon=${startCoords.lng}&appid=${API_KEY}&units=metric`);
            const endForecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${endCoords.lat}&lon=${endCoords.lng}&appid=${API_KEY}&units=metric`);
            
            if (!startResponse.ok || !endResponse.ok || !startForecastResponse.ok || !endForecastResponse.ok) {
                throw new Error('Failed to fetch weather data');
            }
            
            const startData = await startResponse.json();
            const endData = await endResponse.json();
            const startForecast = await startForecastResponse.json();
            const endForecast = await endForecastResponse.json();

            // Calculate route points (simplified version - in a real app, this would use actual route API)
            const numPoints = 5; // Number of points along the route
            const routePoints = [];
            
            for (let i = 0; i < numPoints; i++) {
                const ratio = i / (numPoints - 1);
                const lat = startCoords.lat + ratio * (endCoords.lat - startCoords.lat);
                const lng = startCoords.lng + ratio * (endCoords.lng - startCoords.lng);
                
                // Interpolate weather data between start and end points
                const temp = startData.main.temp + ratio * (endData.main.temp - startData.main.temp);
                
                // Alternate conditions to simulate changing weather along route
                let condition;
                if (i === 0) {
                    condition = startData.weather[0].main;
                } else if (i === numPoints - 1) {
                    condition = endData.weather[0].main;
                } else {
                    // Randomly assign either start or end condition, or a mix
                    const conditions = [startData.weather[0].main, endData.weather[0].main, 'Mixed'];
                    condition = conditions[Math.floor(Math.random() * conditions.length)];
                }
                
                routePoints.push({
                    distance: ratio,
                    lat,
                    lng,
                    temp: Math.round(temp),
                    condition,
                    humidity: Math.round(startData.main.humidity + ratio * (endData.main.humidity - startData.main.humidity)),
                    windSpeed: startData.wind.speed + ratio * (endData.wind.speed - startData.wind.speed)
                });
            }
            
            // Analyze safety based on weather conditions
            const hasSevereWeather = routePoints.some(point => 
                ['Thunderstorm', 'Snow', 'Tornado', 'Hurricane', 'Extreme'].includes(point.condition)
            );
            
            const hasModerateWeather = routePoints.some(point => 
                ['Rain', 'Drizzle', 'Fog', 'Mist', 'Haze'].includes(point.condition)
            );
            
            const highWinds = routePoints.some(point => point.windSpeed > 10);
            
            let safetyStatus, safetyMessage;
            
            if (hasSevereWeather) {
                safetyStatus = 'danger';
                safetyMessage = 'Travel not recommended. Severe weather conditions detected along your route.';
            } else if (hasModerateWeather || highWinds) {
                safetyStatus = 'warning';
                safetyMessage = 'Use caution when traveling. Moderate weather conditions may affect your journey.';
            } else {
                safetyStatus = 'safe';
                safetyMessage = 'Safe to travel. Good weather conditions expected along your route.';
            }
            
            // Get expected weather for arrival (using forecast data)
            const arrivalForecast = endForecast.list[0];
            
            return {
                start: {
                    temp: Math.round(startData.main.temp),
                    condition: startData.weather[0].main,
                    description: startData.weather[0].description,
                    humidity: startData.main.humidity,
                    windSpeed: startData.wind.speed,
                    icon: startData.weather[0].icon
                },
                end: {
                    temp: Math.round(endData.main.temp),
                    condition: endData.weather[0].main,
                    description: endData.weather[0].description,
                    humidity: endData.main.humidity,
                    windSpeed: endData.wind.speed,
                    icon: endData.weather[0].icon
                },
                route: routePoints,
                safety: {
                    status: safetyStatus,
                    message: safetyMessage
                },
                expected: {
                    temp: Math.round(arrivalForecast.main.temp),
                    condition: arrivalForecast.weather[0].main,
                    description: arrivalForecast.weather[0].description,
                    icon: arrivalForecast.weather[0].icon,
                    time: new Date(arrivalForecast.dt * 1000).toLocaleTimeString()
                },
                timestamp: new Date().toLocaleTimeString()
            };
        } catch (error) {
            console.error('Error getting weather data:', error);
            throw error;
        }
    }

    // Display weather information for the route
    function displayRouteWeather(weatherInfo) {
        const routeWeatherInfo = document.getElementById('route-weather-info');
        
        // Show the container when weather info is available
        weatherRouteWindow.classList.remove('hidden');
        setTimeout(() => {
            weatherRouteWindow.classList.add('visible');
        }, 10);
        
        const getSafetyIcon = (status) => {
            switch (status) {
                case 'danger': return '<i class="fas fa-exclamation-triangle" style="color: #ff4d4d;"></i>';
                case 'warning': return '<i class="fas fa-exclamation-circle" style="color: #ffcc00;"></i>';
                case 'safe': return '<i class="fas fa-check-circle" style="color: #66cc66;"></i>';
                default: return '';
            }
        };
        
        routeWeatherInfo.innerHTML = `
            <h4>Weather Along Your Route</h4>
            <div class="weather-update-time">
                <small>Updated: ${weatherInfo.timestamp}</small>
            </div>
            <div class="weather-summary">
                <div class="route-endpoint">
                    <h5>Starting Point (${startLocation.value})</h5>
                    <div class="endpoint-weather">
                        <img src="https://openweathermap.org/img/wn/${weatherInfo.start.icon}.png" alt="${weatherInfo.start.condition}">
                        <div class="endpoint-details">
                            <p>${weatherInfo.start.temp}°C, ${weatherInfo.start.description}</p>
                            <p><small>Humidity: ${weatherInfo.start.humidity}% | Wind: ${weatherInfo.start.windSpeed} m/s</small></p>
                        </div>
                    </div>
                </div>
                
                <div class="route-endpoint">
                    <h5>Destination (${endLocation.value})</h5>
                    <div class="endpoint-weather">
                        <img src="https://openweathermap.org/img/wn/${weatherInfo.end.icon}.png" alt="${weatherInfo.end.condition}">
                        <div class="endpoint-details">
                            <p>${weatherInfo.end.temp}°C, ${weatherInfo.end.description}</p>
                            <p><small>Humidity: ${weatherInfo.end.humidity}% | Wind: ${weatherInfo.end.windSpeed} m/s</small></p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="route-expected">
                <h5>Expected Weather on Arrival</h5>
                <div class="endpoint-weather">
                    <img src="https://openweathermap.org/img/wn/${weatherInfo.expected.icon}.png" alt="${weatherInfo.expected.condition}">
                    <div class="endpoint-details">
                        <p>${weatherInfo.expected.temp}°C, ${weatherInfo.expected.description}</p>
                        <p><small>Expected time: ${weatherInfo.expected.time}</small></p>
                    </div>
                </div>
            </div>
            
            <div class="route-weather">
                <h5>Real-time Route Conditions</h5>
                <div class="route-points-container">
                    ${weatherInfo.route.map(point => `
                        <div class="route-point">
                            <p>${Math.round(point.distance * 100)}% of journey: ${point.temp}°C, ${point.condition}</p>
                            <p><small>Humidity: ${point.humidity}% | Wind: ${point.windSpeed.toFixed(1)} m/s</small></p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="route-safety ${weatherInfo.safety.status}">
                <h5>Travel Safety Assessment</h5>
                <p>${getSafetyIcon(weatherInfo.safety.status)} ${weatherInfo.safety.message}</p>
            </div>
            
            <button id="refresh-route-weather" class="route-refresh-btn">
                <i class="fas fa-sync-alt"></i> Refresh
            </button>
        `;
        
        // Add event listener for refresh button
        document.getElementById('refresh-route-weather').addEventListener('click', async () => {
            try {
                const startCoords = await getCoordinates(startLocation.value);
                const endCoords = await getCoordinates(endLocation.value);
                const updatedWeatherInfo = await getRouteWeather(startCoords, endCoords);
                displayRouteWeather(updatedWeatherInfo);
            } catch (error) {
                console.error('Error refreshing route weather:', error);
            }
        });
    }

    // Handle sending messages
    function sendUserMessage(message) {
        if (!message.trim()) return;

        // Add user message to chat
        addMessage(message, 'user');
        chatInput.value = '';

        // Process the message and get AI response
        processMessage(message);
    }

    // Handle Enter key and send button
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendUserMessage(chatInput.value);
        }
    });

    sendMessage.addEventListener('click', () => {
        sendUserMessage(chatInput.value);
    });

    // Add message to chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', `${sender}-message`);
        
        // Split message into paragraphs for better formatting
        const paragraphs = text.split('\n').filter(p => p.trim());
        paragraphs.forEach((p, index) => {
            const paragraph = document.createElement('p');
            paragraph.textContent = p;
            messageDiv.appendChild(paragraph);
        });
        
        chatMessages.appendChild(messageDiv);
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        
        // Trigger reflow
        messageDiv.offsetHeight;
        
        // Animate message appearance
        messageDiv.style.transition = 'all 0.3s ease';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
        
        // Smooth scroll to latest message
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }

    // Process user message and generate AI response
    function processMessage(message) {
        // Show typing indicator with dynamic dots
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('chat-message', 'bot-message', 'typing-indicator');
        
        const dots = document.createElement('span');
        dots.textContent = '•••';
        typingIndicator.appendChild(dots);
        
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        let dotCount = 3;
        const typingAnimation = setInterval(() => {
            dots.textContent = '•'.repeat(dotCount);
            dotCount = (dotCount % 3) + 1;
        }, 500);

        // Simulate AI thinking time based on message length
        const thinkingTime = Math.min(Math.max(message.length * 50, 1000), 3000);
        
        setTimeout(() => {
            clearInterval(typingAnimation);
            typingIndicator.remove();
            
            const response = generateResponse(message);
            addMessage(response, 'bot');
        }, thinkingTime);
    }

    // Generate AI response based on user message
    function generateResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Enhanced weather-related responses
        if (lowerMessage.includes('weather')) {
            if (lowerMessage.includes('forecast')) {
                return "I can provide detailed weather forecasts! You can:\n• Click on any location on the globe\n• Search for a specific city\n• View 5-day forecasts with detailed metrics";
            }
            return "I can help you with current weather conditions, forecasts, and travel planning. What specific information are you looking for?";
        }
        
        // Travel-related responses
        if (lowerMessage.includes('travel') || lowerMessage.includes('route') || lowerMessage.includes('trip')) {
            return "I can help you plan your travel by:\n• Checking weather conditions along your route\n• Providing safety recommendations\n• Suggesting best travel times\n\nJust enter your start and destination points in the travel guide panel!";
        }
        
        // Location-specific responses
        if (lowerMessage.includes('location') || lowerMessage.includes('place') || lowerMessage.includes('city')) {
            return "You can interact with locations by:\n• Clicking directly on the 3D globe\n• Using the search bar at the top\n• Saving favorite locations for quick access";
        }
        
        // Help and general information
        if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
            return "I'm your weather assistant! I can help you with:\n• Current weather conditions\n• Weather forecasts\n• Travel route planning\n• Weather safety tips\n• Location bookmarking\n\nFeel free to ask me anything about these topics!";
        }
        
        // Greeting responses
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            const greetings = [
                "Hello! How can I help you with weather today?",
                "Hi there! Ready to explore weather conditions?",
                "Greetings! What weather information can I provide for you?"
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }

        // Default response with suggestions
        return "I'm here to help with weather information! You can:\n• Ask about weather conditions\n• Plan travel routes\n• Check forecasts\n• Save locations\n\nWhat would you like to know?";
    }

    // Add welcome message
    setTimeout(() => {
        addMessage("Hello! I'm your weather assistant. How can I help you today?", 'bot');
    }, 1000);
});