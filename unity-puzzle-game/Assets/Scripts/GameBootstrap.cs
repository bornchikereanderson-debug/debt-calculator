using UnityEngine;

public class GameBootstrap : MonoBehaviour
{
    private static bool hasBootstrapped;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void BootstrapIntoScene()
    {
        if (hasBootstrapped || Object.FindObjectOfType<GameBootstrap>() != null)
        {
            return;
        }

        GameObject root = new GameObject("PuzzleGameBootstrap");
        root.AddComponent<GameBootstrap>();
    }

    private void Awake()
    {
        if (hasBootstrapped)
        {
            Destroy(gameObject);
            return;
        }

        hasBootstrapped = true;
        DontDestroyOnLoad(gameObject);
        Application.targetFrameRate = 60;

        Sprite tileSprite = CreateSharedSprite();
        GameManager gameManager = gameObject.AddComponent<GameManager>();
        UIManager uiManager = gameObject.AddComponent<UIManager>();
        BoardController boardController = gameObject.AddComponent<BoardController>();

        uiManager.Initialize(gameManager);
        boardController.Initialize(gameManager, uiManager.BoardContainer, tileSprite);
        gameManager.Initialize(boardController, uiManager);
    }

    private static Sprite CreateSharedSprite()
    {
        Texture2D texture = new Texture2D(1, 1, TextureFormat.RGBA32, false);
        texture.name = "TilePixel";
        texture.SetPixel(0, 0, Color.white);
        texture.Apply();

        return Sprite.Create(
            texture,
            new Rect(0f, 0f, texture.width, texture.height),
            new Vector2(0.5f, 0.5f),
            1f
        );
    }
}
