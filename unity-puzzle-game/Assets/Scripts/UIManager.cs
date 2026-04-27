using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public class UIManager : MonoBehaviour
{
    private readonly Color screenTint = new Color(0.04f, 0.08f, 0.15f, 0.92f);
    private readonly Color accentColor = new Color(1f, 0.76f, 0.27f, 1f);
    private readonly Color hudCardColor = new Color(1f, 1f, 1f, 0.08f);
    private readonly Color buttonColor = new Color(1f, 1f, 1f, 0.12f);

    private Canvas canvas;
    private RectTransform boardContainer;
    private RectTransform gameplayRoot;
    private GameObject homeScreen;
    private GameObject gameOverScreen;
    private GameObject winScreen;
    private Text scoreText;
    private Text movesText;
    private Text targetText;
    private Text levelText;
    private Text gameOverSummary;
    private Text winSummary;

    public RectTransform BoardContainer => boardContainer;

    public void Initialize(GameManager gameManager)
    {
        EnsureEventSystem();
        canvas = CreateCanvas();
        BuildBackground(canvas.transform);
        gameplayRoot = CreateFullStretchRect("GameplayRoot", canvas.transform);
        gameplayRoot.gameObject.SetActive(false);

        BuildHud(gameplayRoot);
        BuildBoardArea(gameplayRoot);

        homeScreen = BuildOverlayScreen(
            "HomeScreen",
            "Tap Blast",
            "Clear groups of 2+ matching tiles, chase the target score, and keep your moves alive.",
            "Play",
            gameManager.StartFirstLevel,
            null,
            null
        );

        gameOverScreen = BuildOverlayScreen(
            "GameOverScreen",
            "Game Over",
            string.Empty,
            "Retry",
            gameManager.RestartCurrentLevel,
            "Home",
            gameManager.ReturnHome
        );
        gameOverSummary = gameOverScreen.transform.Find("Card/SubTitle").GetComponent<Text>();

        winScreen = BuildOverlayScreen(
            "WinScreen",
            "Level Complete",
            string.Empty,
            "Next Level",
            gameManager.AdvanceToNextLevel,
            "Home",
            gameManager.ReturnHome
        );
        winSummary = winScreen.transform.Find("Card/SubTitle").GetComponent<Text>();
    }

    public void RefreshHud(int score, int moves, int targetScore, int level)
    {
        scoreText.text = $"Score\n{score}";
        movesText.text = $"Moves\n{moves}";
        targetText.text = $"Target\n{targetScore}";
        levelText.text = $"Level {level}";
    }

    public void RefreshLevel(int level)
    {
        if (levelText != null)
        {
            levelText.text = $"Level {level}";
        }
    }

    public void ShowHome()
    {
        gameplayRoot.gameObject.SetActive(false);
        homeScreen.SetActive(true);
        gameOverScreen.SetActive(false);
        winScreen.SetActive(false);
    }

    public void ShowGameplay()
    {
        gameplayRoot.gameObject.SetActive(true);
        homeScreen.SetActive(false);
        gameOverScreen.SetActive(false);
        winScreen.SetActive(false);
    }

    public void ShowGameOver(int level, int score, int targetScore)
    {
        gameplayRoot.gameObject.SetActive(true);
        homeScreen.SetActive(false);
        winScreen.SetActive(false);
        gameOverScreen.SetActive(true);
        gameOverSummary.text = $"Level {level}\nFinal Score: {score}\nTarget: {targetScore}\n\nTap Retry for a fast restart.";
    }

    public void ShowWin(int level, int score, int targetScore)
    {
        gameplayRoot.gameObject.SetActive(true);
        homeScreen.SetActive(false);
        gameOverScreen.SetActive(false);
        winScreen.SetActive(true);
        winSummary.text = $"Level {level} cleared.\nScore: {score}\nTarget: {targetScore}\n\nReady to keep climbing?";
    }

    private void BuildHud(RectTransform parent)
    {
        RectTransform topBar = CreateRect("TopBar", parent, new Vector2(0f, 1f), new Vector2(1f, 1f));
        topBar.offsetMin = new Vector2(24f, -180f);
        topBar.offsetMax = new Vector2(-24f, -24f);

        levelText = CreateLabel("LevelText", topBar, "Level 1", 34, TextAnchor.MiddleCenter, FontStyle.Bold);
        RectTransform levelRect = levelText.rectTransform;
        levelRect.anchorMin = new Vector2(0.5f, 1f);
        levelRect.anchorMax = new Vector2(0.5f, 1f);
        levelRect.sizeDelta = new Vector2(300f, 48f);
        levelRect.anchoredPosition = new Vector2(0f, -18f);
        levelText.color = accentColor;

        RectTransform cardRow = CreateRect("CardRow", topBar, new Vector2(0f, 0f), new Vector2(1f, 0f));
        cardRow.sizeDelta = new Vector2(0f, 104f);
        cardRow.anchoredPosition = new Vector2(0f, 0f);

        HorizontalLayoutGroup layout = cardRow.gameObject.AddComponent<HorizontalLayoutGroup>();
        layout.spacing = 12f;
        layout.childForceExpandHeight = true;
        layout.childForceExpandWidth = true;
        layout.childControlHeight = true;
        layout.childControlWidth = true;

        scoreText = CreateHudCard(cardRow, "Score\n0");
        movesText = CreateHudCard(cardRow, "Moves\n20");
        targetText = CreateHudCard(cardRow, "Target\n1400");
    }

    private void BuildBoardArea(RectTransform parent)
    {
        RectTransform boardFrame = CreateRect("BoardFrame", parent, new Vector2(0.5f, 0.46f), new Vector2(0.5f, 0.46f));
        boardFrame.sizeDelta = new Vector2(860f, 860f);

        Image frameImage = boardFrame.gameObject.AddComponent<Image>();
        frameImage.color = new Color(1f, 1f, 1f, 0.06f);

        boardContainer = CreateRect("BoardContainer", boardFrame, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f));
    }

    private GameObject BuildOverlayScreen(
        string name,
        string title,
        string subtitle,
        string primaryButtonLabel,
        UnityEngine.Events.UnityAction primaryAction,
        string secondaryButtonLabel,
        UnityEngine.Events.UnityAction secondaryAction
    )
    {
        GameObject overlay = new GameObject(name);
        overlay.transform.SetParent(canvas.transform, false);
        RectTransform overlayRect = overlay.AddComponent<RectTransform>();
        overlayRect.anchorMin = Vector2.zero;
        overlayRect.anchorMax = Vector2.one;
        overlayRect.offsetMin = Vector2.zero;
        overlayRect.offsetMax = Vector2.zero;

        Image overlayImage = overlay.AddComponent<Image>();
        overlayImage.color = screenTint;

        RectTransform card = CreateRect("Card", overlay.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f));
        card.sizeDelta = new Vector2(760f, 520f);

        Image cardImage = card.gameObject.AddComponent<Image>();
        cardImage.color = new Color(0.08f, 0.12f, 0.2f, 0.96f);

        VerticalLayoutGroup layout = card.gameObject.AddComponent<VerticalLayoutGroup>();
        layout.padding = new RectOffset(48, 48, 48, 48);
        layout.spacing = 20f;
        layout.childAlignment = TextAnchor.UpperCenter;
        layout.childControlHeight = false;
        layout.childControlWidth = true;
        layout.childForceExpandHeight = false;
        layout.childForceExpandWidth = true;

        CreateSpacer(card, 18f);
        Text titleText = CreateLabel("Title", card, title, 56, TextAnchor.MiddleCenter, FontStyle.Bold);
        titleText.color = Color.white;
        LayoutElement titleLayout = titleText.gameObject.AddComponent<LayoutElement>();
        titleLayout.preferredHeight = 84f;

        Text subtitleText = CreateLabel("SubTitle", card, subtitle, 28, TextAnchor.MiddleCenter, FontStyle.Normal);
        subtitleText.color = new Color(0.9f, 0.95f, 1f, 0.9f);
        LayoutElement subtitleLayout = subtitleText.gameObject.AddComponent<LayoutElement>();
        subtitleLayout.preferredHeight = 150f;

        CreateSpacer(card, 10f);
        CreateButton(card, primaryButtonLabel, primaryAction);

        if (!string.IsNullOrEmpty(secondaryButtonLabel) && secondaryAction != null)
        {
            CreateButton(card, secondaryButtonLabel, secondaryAction);
        }

        overlay.SetActive(false);
        return overlay;
    }

    private Text CreateHudCard(RectTransform parent, string text)
    {
        RectTransform card = CreateRect("HudCard", parent, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f));
        LayoutElement element = card.gameObject.AddComponent<LayoutElement>();
        element.preferredWidth = 0f;

        Image image = card.gameObject.AddComponent<Image>();
        image.color = hudCardColor;

        Text label = CreateLabel("Label", card, text, 28, TextAnchor.MiddleCenter, FontStyle.Bold);
        label.color = Color.white;
        label.rectTransform.anchorMin = Vector2.zero;
        label.rectTransform.anchorMax = Vector2.one;
        label.rectTransform.offsetMin = Vector2.zero;
        label.rectTransform.offsetMax = Vector2.zero;
        return label;
    }

    private void CreateButton(RectTransform parent, string label, UnityEngine.Events.UnityAction action)
    {
        RectTransform buttonRect = CreateRect($"{label}Button", parent, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f));
        LayoutElement buttonLayout = buttonRect.gameObject.AddComponent<LayoutElement>();
        buttonLayout.preferredHeight = 82f;

        Image buttonImage = buttonRect.gameObject.AddComponent<Image>();
        buttonImage.color = buttonColor;

        Button button = buttonRect.gameObject.AddComponent<Button>();
        ColorBlock colors = button.colors;
        colors.normalColor = new Color(1f, 1f, 1f, 0f);
        colors.highlightedColor = new Color(1f, 1f, 1f, 0.08f);
        colors.pressedColor = new Color(1f, 1f, 1f, 0.18f);
        colors.selectedColor = colors.highlightedColor;
        button.colors = colors;
        button.onClick.AddListener(action);

        Text buttonLabel = CreateLabel("Label", buttonRect, label, 30, TextAnchor.MiddleCenter, FontStyle.Bold);
        buttonLabel.color = Color.white;
        buttonLabel.rectTransform.anchorMin = Vector2.zero;
        buttonLabel.rectTransform.anchorMax = Vector2.one;
        buttonLabel.rectTransform.offsetMin = Vector2.zero;
        buttonLabel.rectTransform.offsetMax = Vector2.zero;
    }

    private void CreateSpacer(RectTransform parent, float height)
    {
        GameObject spacer = new GameObject("Spacer");
        spacer.transform.SetParent(parent, false);
        LayoutElement layout = spacer.AddComponent<LayoutElement>();
        layout.preferredHeight = height;
    }

    private Canvas CreateCanvas()
    {
        GameObject canvasObject = new GameObject("PuzzleCanvas");
        canvasObject.transform.SetParent(transform, false);

        Canvas createdCanvas = canvasObject.AddComponent<Canvas>();
        createdCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvasObject.AddComponent<GraphicRaycaster>();

        CanvasScaler scaler = canvasObject.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1080f, 1920f);
        scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
        scaler.matchWidthOrHeight = 0.6f;
        return createdCanvas;
    }

    private void BuildBackground(Transform parent)
    {
        RectTransform background = CreateRect("Background", parent, Vector2.zero, Vector2.one);
        background.offsetMin = Vector2.zero;
        background.offsetMax = Vector2.zero;

        Image image = background.gameObject.AddComponent<Image>();
        image.color = new Color(0.03f, 0.05f, 0.1f, 1f);
    }

    private static RectTransform CreateFullStretchRect(string name, Transform parent)
    {
        RectTransform rect = CreateRect(name, parent, Vector2.zero, Vector2.one);
        rect.offsetMin = Vector2.zero;
        rect.offsetMax = Vector2.zero;
        return rect;
    }

    private static RectTransform CreateRect(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax)
    {
        GameObject go = new GameObject(name);
        go.transform.SetParent(parent, false);
        RectTransform rect = go.AddComponent<RectTransform>();
        rect.anchorMin = anchorMin;
        rect.anchorMax = anchorMax;
        rect.pivot = new Vector2(0.5f, 0.5f);
        return rect;
    }

    private static Text CreateLabel(string name, Transform parent, string content, int fontSize, TextAnchor alignment, FontStyle fontStyle)
    {
        RectTransform rect = CreateRect(name, parent, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f));
        Text label = rect.gameObject.AddComponent<Text>();
        label.text = content;
        label.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        label.fontSize = fontSize;
        label.alignment = alignment;
        label.fontStyle = fontStyle;
        label.horizontalOverflow = HorizontalWrapMode.Wrap;
        label.verticalOverflow = VerticalWrapMode.Overflow;
        label.color = Color.white;
        return label;
    }

    private static void EnsureEventSystem()
    {
        if (Object.FindObjectOfType<EventSystem>() != null)
        {
            return;
        }

        GameObject eventSystemObject = new GameObject("EventSystem");
        eventSystemObject.AddComponent<EventSystem>();
        eventSystemObject.AddComponent<StandaloneInputModule>();
    }
}
