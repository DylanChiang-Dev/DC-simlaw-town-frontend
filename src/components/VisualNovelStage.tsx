import { characters, type DialogueScene } from '../data/runtimeScene';

type Props = {
  scene: DialogueScene;
};

export function VisualNovelStage({ scene }: Props) {
  const visibleCharacters = getVisibleCharacters(scene);

  return (
    <section className="vn-stage" aria-label="案件场景">
      <img className="vn-background" src={scene.background} alt={`${scene.stageName}场景`} />
      <div className="vn-vignette" />
      <div className={`portrait-layer count-${visibleCharacters.length}`}>
        {visibleCharacters.map((key) => {
          const character = characters[key];
          const active = key === scene.speaker;
          const position = getSceneCharacterPosition(scene.stageCode, key, character.position);
          return (
            <img
              className={`character-portrait ${position} ${active ? 'active' : 'inactive'}`}
              src={character.portrait}
              alt={`${character.name} ${character.role}`}
              key={key}
            />
          );
        })}
      </div>
    </section>
  );
}

function getVisibleCharacters(scene: DialogueScene) {
  if (scene.speaker === 'system') return [];
  return [scene.speaker];
}

function getSceneCharacterPosition(
  stageCode: string,
  key: string,
  fallback: 'left' | 'center' | 'right',
): 'left' | 'center' | 'right' {
  if (stageCode === 'RECEPTION') {
    if (key === 'client') return 'left';
    if (key === 'defendant') return 'left';
    if (key === 'receptionist') return 'right';
  }
  if (stageCode === 'CIA' && key === 'appealJudge') return 'center';
  return fallback;
}
