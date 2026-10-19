import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';
import { GameTheme } from '../utils/themes';
import { GameDifficulty, DIFFICULTY_SETTINGS } from '../utils/difficulty';

interface FallingPiece {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
}

export type GameStatus = 'ready' | 'playing' | 'ended' | 'resetting';

interface StackerGameProps {
  theme: GameTheme;
  difficulty: GameDifficulty;
  gameStatus: GameStatus;
  score: number;
  combo: number;
  lives: number;
  onScoreChange: (score: number) => void;
  onComboChange: (combo: number) => void;
  onLivesChange: (lives: number) => void;
  onStatusChange: (status: GameStatus) => void;
  onPerfectHit?: (combo: number) => void;
  onAlignmentChange?: (isAligned: boolean) => void;
  onShieldSaved?: () => void;
  onBlockGrew?: () => void;
}

export interface StackerGameHandle {
  action: () => void;
  restart: () => void;
  revive: () => void;
}

export const StackerGame = React.forwardRef<StackerGameHandle, StackerGameProps>(({
  theme,
  difficulty,
  gameStatus,
  score,
  combo,
  lives,
  onScoreChange,
  onComboChange,
  onLivesChange,
  onStatusChange,
  onPerfectHit,
  onAlignmentChange,
  onShieldSaved,
  onBlockGrew,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<GameStatus>(gameStatus);
  statusRef.current = gameStatus;

  const scoreRef = useRef<number>(score);
  scoreRef.current = score;

  const comboRef = useRef<number>(combo);
  comboRef.current = combo;

  const livesRef = useRef<number>(lives);
  livesRef.current = lives;

  const themeRef = useRef<GameTheme>(theme);
  themeRef.current = theme;

  const difficultyRef = useRef<GameDifficulty>(difficulty);
  difficultyRef.current = difficulty;

  const lastAlignedState = useRef<boolean>(false);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const targetCameraY = useRef<number>(4);
  const currentCameraY = useRef<number>(4);
  const lookTargetY = useRef<number>(0);
  const currentLookY = useRef<number>(0);

  // Groups
  const newBlocksGroup = useRef<THREE.Group>(new THREE.Group());
  const placedBlocksGroup = useRef<THREE.Group>(new THREE.Group());
  const fallingPieces = useRef<FallingPiece[]>([]);

  // Internal block data structures
  interface BlockData {
    index: number;
    dimension: { width: number; height: number; depth: number };
    position: { x: number; y: number; z: number };
    workingPlane: 'x' | 'z';
    workingDimension: 'width' | 'depth';
    speed: number;
    direction: number;
    mesh: THREE.Mesh;
    colorOffset: number;
    state: 'active' | 'stopped' | 'missed';
  }

  const blocksRef = useRef<BlockData[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const MOVE_AMOUNT = 11;

  // Create block mesh helper
  const createBlockMesh = (width: number, height: number, depth: number, color: THREE.ColorRepresentation) => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(width / 2, height / 2, depth / 2));
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.05,
      flatShading: true,
    });
    return new THREE.Mesh(geometry, material);
  };

  // Update orthographic camera frustum responsively
  const updateCameraFrustum = useCallback(() => {
    if (!cameraRef.current || !rendererRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;
    const aspect = width / height;

    rendererRef.current.setSize(width, height);

    // Responsive scaling
    let d = 20;
    if (aspect < 0.6) {
      d = 13.5 / aspect;
    } else if (aspect < 1) {
      d = 16.5 / aspect;
    } else {
      d = 20;
    }

    cameraRef.current.left = -d * aspect;
    cameraRef.current.right = d * aspect;
    cameraRef.current.top = d;
    cameraRef.current.bottom = -d;
    cameraRef.current.updateProjectionMatrix();
  }, []);

  // Add block to game with difficulty-adjusted speed
  const addNewMovingBlock = useCallback((targetBlock: BlockData | null) => {
    if (!sceneRef.current) return;

    const diffConfig = DIFFICULTY_SETTINGS[difficultyRef.current] || DIFFICULTY_SETTINGS.easy;
    const index = (targetBlock ? targetBlock.index : 0) + 1;
    const workingPlane: 'x' | 'z' = index % 2 === 1 ? 'x' : 'z';
    const workingDimension: 'width' | 'depth' = index % 2 === 1 ? 'width' : 'depth';

    const width = targetBlock ? targetBlock.dimension.width : 10;
    const height = 2;
    const depth = targetBlock ? targetBlock.dimension.depth : 10;

    const posX = targetBlock ? targetBlock.position.x : 0;
    const posY = height * (index - 1);
    const posZ = targetBlock ? targetBlock.position.z : 0;

    const colorOffset = targetBlock ? targetBlock.colorOffset : Math.floor(Math.random() * 80);

    let color: THREE.Color;
    if (!targetBlock) {
      color = new THREE.Color(themeRef.current.baseBlockColor);
    } else {
      const rgb = themeRef.current.getColor(index, colorOffset);
      color = new THREE.Color(rgb.r, rgb.g, rgb.b);
    }

    const mesh = createBlockMesh(width, height, depth, color);
    mesh.position.set(posX, posY, posZ);

    const isBase = index === 1;
    const state = isBase ? 'stopped' : 'active';

    // Speed tuned by difficulty
    const speedMagnitude = Math.min(
      diffConfig.speedBase + (index * diffConfig.speedIncrement),
      diffConfig.speedMax
    );
    const direction = -speedMagnitude;

    const block: BlockData = {
      index,
      dimension: { width, height, depth },
      position: { x: posX, y: posY, z: posZ },
      workingPlane,
      workingDimension,
      speed: speedMagnitude,
      direction,
      mesh,
      colorOffset,
      state,
    };

    if (state === 'active') {
      block.position[workingPlane] = Math.random() > 0.5 ? -MOVE_AMOUNT : MOVE_AMOUNT;
      mesh.position[workingPlane] = block.position[workingPlane];
      block.direction = block.position[workingPlane] < 0 ? speedMagnitude : -speedMagnitude;
      newBlocksGroup.current.add(mesh);
    } else {
      placedBlocksGroup.current.add(mesh);
    }

    blocksRef.current.push(block);

    // Smooth camera elevation
    targetCameraY.current = posY + 4;
    lookTargetY.current = posY;
  }, []);

  // Place active block logic with accessibility & assist
  const placeActiveBlock = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    const blocks = blocksRef.current;
    if (blocks.length < 2) return;

    const currentBlock = blocks[blocks.length - 1];
    const targetBlock = blocks[blocks.length - 2];
    if (currentBlock.state !== 'active') return;

    const diffConfig = DIFFICULTY_SETTINGS[difficultyRef.current] || DIFFICULTY_SETTINGS.easy;
    currentBlock.state = 'stopped';
    newBlocksGroup.current.remove(currentBlock.mesh);

    const plane = currentBlock.workingPlane;
    const dimensionKey = currentBlock.workingDimension;

    const delta = currentBlock.position[plane] - targetBlock.position[plane];
    let overlap = targetBlock.dimension[dimensionKey] - Math.abs(delta);

    // Generous magnetic alignment threshold for easier play
    const isPerfect = Math.abs(delta) <= diffConfig.perfectTolerance;

    if (isPerfect) {
      overlap = targetBlock.dimension[dimensionKey];
      currentBlock.position.x = targetBlock.position.x;
      currentBlock.position.z = targetBlock.position.z;

      // Bonus Regrowth: if player strings combos, grow block size back up!
      let newDimension = targetBlock.dimension[dimensionKey];
      const nextCombo = comboRef.current + 1;

      if (diffConfig.sizeRegrowth && nextCombo >= 2 && newDimension < 10) {
        newDimension = Math.min(newDimension + 0.8, 10);
        soundManager.playGrow();
        onBlockGrew?.();
      }

      currentBlock.dimension[dimensionKey] = newDimension;
      if (dimensionKey === 'width') {
        currentBlock.dimension.depth = targetBlock.dimension.depth;
      } else {
        currentBlock.dimension.width = targetBlock.dimension.width;
      }

      // Create aligned block
      const placedMesh = createBlockMesh(
        currentBlock.dimension.width,
        currentBlock.dimension.height,
        currentBlock.dimension.depth,
        (currentBlock.mesh.material as THREE.MeshStandardMaterial).color
      );
      placedMesh.position.set(currentBlock.position.x, currentBlock.position.y, currentBlock.position.z);
      placedBlocksGroup.current.add(placedMesh);

      onComboChange(nextCombo);
      soundManager.playPerfect(nextCombo);
      onPerfectHit?.(nextCombo);

      // Celebrate combo milestone with confetti
      if (nextCombo >= 3) {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.35, x: 0.5 },
          colors: ['#38bdf8', '#4ade80', '#fbbf24', '#f472b6'],
          disableForReducedMotion: true,
        });
      }
    } else if (overlap > 0) {
      // Minimum block dimension protection: blocks won't shrink to needle size!
      if (overlap < diffConfig.minBlockSize) {
        overlap = Math.min(diffConfig.minBlockSize, targetBlock.dimension[dimensionKey]);
      }

      // Sliced block
      const choppedDimension = { ...currentBlock.dimension };
      choppedDimension[dimensionKey] = Math.max(currentBlock.dimension[dimensionKey] - overlap, 0.5);
      currentBlock.dimension[dimensionKey] = overlap;

      // Placed part
      const placedMesh = createBlockMesh(
        currentBlock.dimension.width,
        currentBlock.dimension.height,
        currentBlock.dimension.depth,
        (currentBlock.mesh.material as THREE.MeshStandardMaterial).color
      );

      // Chopped part
      const choppedMesh = createBlockMesh(
        choppedDimension.width,
        choppedDimension.height,
        choppedDimension.depth,
        (currentBlock.mesh.material as THREE.MeshStandardMaterial).color
      );

      const choppedPosition = { ...currentBlock.position };

      if (currentBlock.position[plane] < targetBlock.position[plane]) {
        currentBlock.position[plane] = targetBlock.position[plane];
      } else {
        choppedPosition[plane] += overlap;
      }

      placedMesh.position.set(currentBlock.position.x, currentBlock.position.y, currentBlock.position.z);
      choppedMesh.position.set(choppedPosition.x, choppedPosition.y, choppedPosition.z);

      placedBlocksGroup.current.add(placedMesh);
      sceneRef.current?.add(choppedMesh);

      // Add physics impulse to falling slice
      const pushDirection = currentBlock.position[plane] > targetBlock.position[plane] ? 1 : -1;
      fallingPieces.current.push({
        mesh: choppedMesh,
        vx: plane === 'x' ? pushDirection * 0.12 : 0,
        vy: -0.02,
        vz: plane === 'z' ? pushDirection * 0.12 : 0,
        rx: plane === 'z' ? (Math.random() - 0.5) * 0.15 : 0.05,
        ry: (Math.random() - 0.5) * 0.08,
        rz: plane === 'x' ? (Math.random() - 0.5) * 0.15 : 0.05,
      });

      onComboChange(0);
      soundManager.playSlice();
    } else {
      // Missed completely! Check for shield lives in Easy/Normal mode
      if (livesRef.current > 0) {
        const nextLives = livesRef.current - 1;
        onLivesChange(nextLives);
        soundManager.playShieldSave();
        onShieldSaved?.();

        // Respawn this block back on track so player gets another chance without dying!
        currentBlock.state = 'active';
        currentBlock.position[plane] = currentBlock.direction > 0 ? -MOVE_AMOUNT : MOVE_AMOUNT;
        currentBlock.mesh.position[plane] = currentBlock.position[plane];
        newBlocksGroup.current.add(currentBlock.mesh);
        return;
      }

      // If no lives, game over
      currentBlock.state = 'missed';
      sceneRef.current?.add(currentBlock.mesh);

      fallingPieces.current.push({
        mesh: currentBlock.mesh,
        vx: currentBlock.direction * 0.8,
        vy: -0.05,
        vz: 0,
        rx: (Math.random() - 0.5) * 0.1,
        ry: 0.05,
        rz: (Math.random() - 0.5) * 0.1,
      });

      soundManager.playGameOver();
      onStatusChange('ended');
      return;
    }

    // Update score
    const newScore = blocksRef.current.length - 1;
    onScoreChange(newScore);

    // Spawn next block
    addNewMovingBlock(currentBlock);
  }, [addNewMovingBlock, onBlockGrew, onComboChange, onLivesChange, onPerfectHit, onScoreChange, onShieldSaved, onStatusChange]);

  // Start new game
  const startGame = useCallback(() => {
    const diffConfig = DIFFICULTY_SETTINGS[difficultyRef.current] || DIFFICULTY_SETTINGS.easy;
    onScoreChange(0);
    onComboChange(0);
    onLivesChange(diffConfig.initialLives);
    onStatusChange('playing');
    addNewMovingBlock(blocksRef.current[0] || null);
    soundManager.playPlace(0);
  }, [addNewMovingBlock, onComboChange, onLivesChange, onScoreChange, onStatusChange]);

  // Restart clean game with reset animation
  const restartGame = useCallback(() => {
    onStatusChange('resetting');
    targetCameraY.current = 4;
    lookTargetY.current = 0;

    // Clear falling pieces
    fallingPieces.current.forEach(p => {
      sceneRef.current?.remove(p.mesh);
      p.mesh.geometry.dispose();
      if (Array.isArray(p.mesh.material)) {
        p.mesh.material.forEach(m => m.dispose());
      } else {
        p.mesh.material.dispose();
      }
    });
    fallingPieces.current = [];

    // Clear placed blocks except base block
    while (placedBlocksGroup.current.children.length > 0) {
      const child = placedBlocksGroup.current.children[0] as THREE.Mesh;
      placedBlocksGroup.current.remove(child);
      child.geometry?.dispose();
    }

    while (newBlocksGroup.current.children.length > 0) {
      const child = newBlocksGroup.current.children[0] as THREE.Mesh;
      newBlocksGroup.current.remove(child);
      child.geometry?.dispose();
    }

    blocksRef.current = [];
    addNewMovingBlock(null); // Base block

    setTimeout(() => {
      startGame();
    }, 250);
  }, [addNewMovingBlock, onStatusChange, startGame]);

  // Revive / Continuer (e.g. after watching rewarded ad)
  const reviveGame = useCallback(() => {
    if (blocksRef.current.length < 2) return;
    const missed = blocksRef.current.pop();
    if (missed && sceneRef.current) {
      sceneRef.current.remove(missed.mesh);
    }
    const lastValid = blocksRef.current[blocksRef.current.length - 1];
    onStatusChange('playing');
    addNewMovingBlock(lastValid);
    soundManager.playPlace(1);
  }, [addNewMovingBlock, onStatusChange]);

  // Expose controls to parent via ref
  React.useImperativeHandle(ref, () => ({
    action: () => {
      if (statusRef.current === 'ready') {
        startGame();
      } else if (statusRef.current === 'playing') {
        placeActiveBlock();
      } else if (statusRef.current === 'ended') {
        restartGame();
      }
    },
    restart: restartGame,
    revive: reviveGame,
  }));

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(new THREE.Color(themeRef.current.bgColor), 1);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera: Orthographic camera
    const aspect = width / height;
    const d = aspect < 0.6 ? 13.5 / aspect : aspect < 1 ? 16.5 / aspect : 20;
    const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, -100, 1000);
    camera.position.set(2, 4, 2);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    cameraRef.current = camera;

    // Lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(10, 40, 20);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-10, 20, -20);
    scene.add(backLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    // Groups
    scene.add(newBlocksGroup.current);
    scene.add(placedBlocksGroup.current);

    // Initialize base block
    addNewMovingBlock(null);
    onStatusChange('ready');

    // Handle resize
    const handleResize = () => {
      updateCameraFrustum();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Animation Loop
    let isRunning = true;
    const animate = (timestamp: number) => {
      if (!isRunning) return;

      const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      // Update active block
      const blocks = blocksRef.current;
      if (blocks.length > 0) {
        const activeBlock = blocks[blocks.length - 1];
        if (activeBlock.state === 'active') {
          const plane = activeBlock.workingPlane;
          const currentVal = activeBlock.position[plane];
          if (currentVal > MOVE_AMOUNT || currentVal < -MOVE_AMOUNT) {
            activeBlock.direction = currentVal > 0 ? -activeBlock.speed : activeBlock.speed;
          }
          activeBlock.position[plane] += activeBlock.direction * (delta * 60);
          activeBlock.mesh.position[plane] = activeBlock.position[plane];

          // Real-time alignment assistance check
          if (blocks.length >= 2) {
            const targetBlock = blocks[blocks.length - 2];
            const diffConfig = DIFFICULTY_SETTINGS[difficultyRef.current] || DIFFICULTY_SETTINGS.easy;
            const deltaDist = Math.abs(activeBlock.position[plane] - targetBlock.position[plane]);
            const isAligned = deltaDist <= diffConfig.perfectTolerance;
            if (isAligned !== lastAlignedState.current) {
              lastAlignedState.current = isAligned;
              onAlignmentChange?.(isAligned);
            }
          }
        }
      }

      // Update falling pieces physics
      for (let i = fallingPieces.current.length - 1; i >= 0; i--) {
        const p = fallingPieces.current[i];
        p.vy -= 0.015 * (delta * 60);
        p.mesh.position.x += p.vx * (delta * 60);
        p.mesh.position.y += p.vy * (delta * 60);
        p.mesh.position.z += p.vz * (delta * 60);
        p.mesh.rotation.x += p.rx * (delta * 60);
        p.mesh.rotation.y += p.ry * (delta * 60);
        p.mesh.rotation.z += p.rz * (delta * 60);

        if (p.mesh.position.y < currentCameraY.current - 35) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          fallingPieces.current.splice(i, 1);
        }
      }

      // Smooth camera interpolation
      const camLerpFactor = 0.08;
      currentCameraY.current += (targetCameraY.current - currentCameraY.current) * camLerpFactor;
      currentLookY.current += (lookTargetY.current - currentLookY.current) * camLerpFactor;

      if (cameraRef.current) {
        cameraRef.current.position.y = currentCameraY.current;
        cameraRef.current.lookAt(0, currentLookY.current, 0);
      }

      renderer.render(scene, camera);
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      isRunning = false;
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      renderer.dispose();
    };
  }, [addNewMovingBlock, onAlignmentChange, onStatusChange, updateCameraFrustum]);

  // Update theme in real time
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setClearColor(new THREE.Color(theme.bgColor), 1);
    }
  }, [theme]);

  // Touch & click interaction on canvas
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (statusRef.current === 'ready') {
      startGame();
    } else if (statusRef.current === 'playing') {
      placeActiveBlock();
    } else if (statusRef.current === 'ended') {
      restartGame();
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      className="absolute inset-0 w-full h-full cursor-pointer select-none touch-none overflow-hidden"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    />
  );
});

StackerGame.displayName = 'StackerGame';
