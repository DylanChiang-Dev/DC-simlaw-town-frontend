import { characters, type DialogueScene } from '../data/runtimeScene';

type Props = {
  scene: DialogueScene;
};

export function VisualNovelStage({ scene }: Props) {
  return (
    <section className="vn-stage" aria-label="案件场景">
      <img className="vn-background" src={scene.background} alt={`${scene.stageName}场景`} />
      <div className="vn-vignette" />
      <div className={`portrait-layer count-${scene.characters.length}`}>
        {scene.characters.map((key) => {
          const character = characters[key];
          const active = key === scene.speaker;
          return (
            <img
              className={`character-portrait ${character.position} ${active ? 'active' : 'inactive'}`}
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
