/**
 * Infinity Club - 3D Queen Component
 * Vite + React Three.js version
 */

import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function Queen3D({
    modelUrl = '/models/queen1.glb',
    scale = 1.4,
    positionY = -0.1,
    enableParallax = true,
    enableFloat = false,
    className = '',
    onModelLoaded = null
}) {
    const mountRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        // ============================================
        // 1. SCENE, CAMERA & RENDERER
        // ============================================

        const scene = new THREE.Scene();

        const width = container.clientWidth || 300;
        const height = container.clientHeight || 400;

        const camera = new THREE.PerspectiveCamera(
            26,
            width / height,
            0.1,
            100
        );

        camera.position.set(0, 1.6, 4.6);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 2)
        );

        renderer.setSize(width, height);

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.4;

        renderer.domElement.className = 'three-canvas-model';

        container.appendChild(renderer.domElement);

        // ============================================
        // 2. STUDIO LIGHTING
        // ============================================

        const ambientLight = new THREE.AmbientLight(
            '#ffd79e',
            0.8
        );

        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(
            '#fff0d0',
            3.0
        );

        mainLight.position.set(3, 5, 4);
        scene.add(mainLight);

        const goldRimLight = new THREE.DirectionalLight(
            '#F59E0B',
            3.5
        );

        goldRimLight.position.set(-3, 3, -2);
        scene.add(goldRimLight);

        const cyanLight = new THREE.PointLight(
            '#37A4DB',
            2.0,
            10
        );

        cyanLight.position.set(2, -1, 2);
        scene.add(cyanLight);

        const crimsonLight = new THREE.PointLight(
            '#A0003B',
            1.5,
            8
        );

        crimsonLight.position.set(0, -2, 0);
        scene.add(crimsonLight);

        // ============================================
        // 3. MODEL GROUP & PARALLAX
        // ============================================

        let mixer = null;

        const modelGroup = new THREE.Group();
        scene.add(modelGroup);

        let mouseX = 0;
        let mouseY = 0;

        let targetRotationX = 0;
        let targetRotationY = 0;

        const onMouseMove = (e) => {
            if (!enableParallax) return;

            const windowHalfX = window.innerWidth / 2;
            const windowHalfY = window.innerHeight / 2;

            mouseX =
                (e.clientX - windowHalfX) * 0.0006;

            mouseY =
                (e.clientY - windowHalfY) * 0.0004;
        };

        window.addEventListener(
            'mousemove',
            onMouseMove
        );

        // ============================================
        // 4. LOAD GLTF MODEL
        // ============================================

        const loader = new GLTFLoader();

        loader.load(
            modelUrl,

            (gltf) => {
                const model = gltf.scene;

                // ========================================
                // AUTO CENTER & SCALE
                // ========================================

                const box = new THREE.Box3()
                    .setFromObject(model);

                const size = box.getSize(
                    new THREE.Vector3()
                );

                const center = box.getCenter(
                    new THREE.Vector3()
                );

                const maxDim = Math.max(
                    size.x,
                    size.y,
                    size.z
                );

                const autoScale =
                    scale / (maxDim || 1);

                model.scale.set(
                    autoScale,
                    autoScale,
                    autoScale
                );

                model.position.x =
                    -center.x * autoScale;

                model.position.y =
                    -center.y * autoScale +
                    positionY;

                model.position.z =
                    -center.z * autoScale;

                // ========================================
                // MATERIAL & DEPTH DESIGN
                // ========================================

                model.traverse((child) => {
                    if (!child.isMesh) return;

                    const nameLower =
                        (child.name || '').toLowerCase();

                    // ------------------------------------
                    // INVISIBLE CUBE DEPTH MASK
                    // ------------------------------------

                    if (nameLower.includes('cube')) {

                        child.material =
                            new THREE.MeshBasicMaterial({
                                colorWrite: false,
                                depthWrite: true,
                            });

                        child.renderOrder = 0;

                        child.castShadow = false;
                        child.receiveShadow = false;
                    }

                    // ------------------------------------
                    // BLACK PLANE / HOLE
                    // ------------------------------------

                    else if (
                        nameLower.includes('plane')
                    ) {

                        child.material =
                            new THREE.MeshBasicMaterial({
                                color: 0x000000,
                                depthWrite: true,
                            });

                        child.renderOrder = 1;

                        child.castShadow = false;
                        child.receiveShadow = false;
                    }

                    // ------------------------------------
                    // QUEEN — ORIGINAL MATERIAL DESIGN
                    // ------------------------------------

                    else {

                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.renderOrder = 2;

                        if (child.material) {

                            child.material.metalness =
                                Math.max(
                                    child.material.metalness || 0.4,
                                    0.4
                                );

                            child.material.roughness =
                                Math.min(
                                    child.material.roughness || 0.3,
                                    0.4
                                );
                        }
                    }
                });

                modelGroup.add(model);

                // ========================================
                // PLAY GLTF ANIMATIONS
                // ========================================

                if (
                    gltf.animations &&
                    gltf.animations.length > 0
                ) {
                    mixer =
                        new THREE.AnimationMixer(model);

                    gltf.animations.forEach((clip) => {

                        const action =
                            mixer.clipAction(clip);

                        action.setLoop(
                            THREE.LoopRepeat
                        );

                        action.play();
                    });
                }

                setLoading(false);

                if (onModelLoaded) {
                    onModelLoaded({
                        gltf,
                        model,
                        animations: gltf.animations
                    });
                }
            },

            undefined,

            (err) => {
                console.warn(
                    `Error loading model ${modelUrl}:`,
                    err
                );

                setError(err);
                setLoading(false);
            }
        );

        // ============================================
        // 5. RESPONSIVE RESIZE
        // ============================================

        const handleResize = () => {
            if (!container) return;

            const w = container.clientWidth;
            const h = container.clientHeight;

            camera.aspect = w / h;
            camera.updateProjectionMatrix();

            renderer.setSize(w, h);
        };

        window.addEventListener(
            'resize',
            handleResize
        );

        // ============================================
        // 6. ANIMATION LOOP
        // ============================================

        const clock = new THREE.Clock();

        let reqId;

        const animate = () => {

            reqId =
                requestAnimationFrame(animate);

            const delta = clock.getDelta();

            // GLTF animation
            if (mixer) {
                mixer.update(delta);
            }

            // ----------------------------------------
            // MOUSE PARALLAX
            // ----------------------------------------

            if (enableParallax) {

                targetRotationY +=
                    (mouseX - targetRotationY) *
                    0.05;

                targetRotationX +=
                    (mouseY - targetRotationX) *
                    0.05;

                modelGroup.rotation.y =
                    targetRotationY;

                modelGroup.rotation.x =
                    targetRotationX;
            }

            // ----------------------------------------
            // FLOATING
            // ----------------------------------------

            if (enableFloat) {

                const time =
                    clock.getElapsedTime();

                modelGroup.position.y =
                    Math.sin(time * 1.5) *
                    0.06;
            }

            renderer.render(
                scene,
                camera
            );
        };

        animate();

        // ============================================
        // 7. CLEANUP
        // ============================================

        return () => {

            cancelAnimationFrame(reqId);

            window.removeEventListener(
                'resize',
                handleResize
            );

            window.removeEventListener(
                'mousemove',
                onMouseMove
            );

            if (
                renderer.domElement &&
                container.contains(
                    renderer.domElement
                )
            ) {
                container.removeChild(
                    renderer.domElement
                );
            }

            renderer.dispose();
        };

    }, [
        modelUrl,
        scale,
        positionY,
        enableParallax,
        enableFloat,
        onModelLoaded
    ]);

    return (
        <div
            className={`three-queen-container ${className}`}
            ref={mountRef}
        >
            <div className="model-backdrop-glow"></div>

            {loading && (
                <div className="model-loader">
                    <div className="spinner"></div>

                    <span>
                        Summoning 3D Queen...
                    </span>
                </div>
            )}

            {error && (
                <div
                    className="model-error"
                    style={{
                        color: '#ef4444',
                        fontSize: '12px',
                        textAlign: 'center'
                    }}
                >
                    Failed to load 3D model
                </div>
            )}
        </div>
    );
}

export default Queen3D;