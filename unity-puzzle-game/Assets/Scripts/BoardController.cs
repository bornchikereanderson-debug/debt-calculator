using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class BoardController : MonoBehaviour
{
    [Header("Board")]
    [SerializeField] private int width = 8;
    [SerializeField] private int height = 8;
    [SerializeField] private float tileSize = 92f;
    [SerializeField] private float tileGap = 8f;
    [SerializeField] private int colorCount = 5;

    [Header("Animation")]
    [SerializeField] private float postCascadeDelay = 0.04f;

    private readonly Queue<TileView> recycledTiles = new Queue<TileView>();
    private readonly Vector2Int[] directions =
    {
        Vector2Int.up,
        Vector2Int.down,
        Vector2Int.left,
        Vector2Int.right,
    };

    private readonly Dictionary<TileColorId, Color> tileColors = new Dictionary<TileColorId, Color>()
    {
        { TileColorId.Red, new Color32(239, 83, 80, 255) },
        { TileColorId.Blue, new Color32(66, 165, 245, 255) },
        { TileColorId.Green, new Color32(102, 187, 106, 255) },
        { TileColorId.Yellow, new Color32(255, 202, 40, 255) },
        { TileColorId.Purple, new Color32(171, 71, 188, 255) },
    };

    private GameManager gameManager;
    private RectTransform boardRoot;
    private Sprite tileSprite;
    private TileView[,] tiles;
    private bool isBusy;

    public void Initialize(GameManager owner, RectTransform root, Sprite sprite)
    {
        gameManager = owner;
        boardRoot = root;
        tileSprite = sprite;
        tiles = new TileView[width, height];

        Vector2 boardSize = new Vector2(
            width * tileSize + (width - 1) * tileGap,
            height * tileSize + (height - 1) * tileGap
        );

        boardRoot.sizeDelta = boardSize;
    }

    public void BuildFreshBoard()
    {
        StopAllCoroutines();
        isBusy = false;
        ClearBoard();

        for (int column = 0; column < width; column++)
        {
            for (int row = 0; row < height; row++)
            {
                TileView tile = CreateOrReuseTile(column, row, GetRandomColorId());
                tile.SetAnchoredPositionImmediate(GetTilePosition(column, row));
                tiles[column, row] = tile;
            }
        }

        EnsurePlayableBoard();
    }

    public void HandleTilePressed(TileView tile)
    {
        if (tile == null || isBusy || !gameManager.CanAcceptInput)
        {
            return;
        }

        List<TileView> group = FindConnectedGroup(tile.Column, tile.Row);
        if (group.Count < 2)
        {
            tile.PlayInvalidPulse();
            return;
        }

        StartCoroutine(ClearGroupRoutine(group));
    }

    public Color GetTileColor(TileColorId colorId)
    {
        return tileColors[colorId];
    }

    private IEnumerator ClearGroupRoutine(List<TileView> group)
    {
        isBusy = true;
        gameManager.RegisterPlayerMove(group.Count);

        foreach (TileView tile in group)
        {
            StartCoroutine(tile.AnimateRemove());
        }

        yield return new WaitForSeconds(0.18f);

        foreach (TileView tile in group)
        {
            tiles[tile.Column, tile.Row] = null;
            ReleaseTile(tile);
        }

        yield return StartCoroutine(ApplyGravityAndRefill());
        yield return new WaitForSeconds(postCascadeDelay);

        if (!HasAnyAvailableGroup())
        {
            ReshuffleBoardUntilPlayable();
        }

        isBusy = false;
        gameManager.EvaluateBoardAfterMove();
    }

    private IEnumerator ApplyGravityAndRefill()
    {
        List<IEnumerator> animations = new List<IEnumerator>();

        for (int column = 0; column < width; column++)
        {
            int nextOpenRow = 0;

            for (int row = 0; row < height; row++)
            {
                TileView tile = tiles[column, row];
                if (tile == null)
                {
                    continue;
                }

                if (row != nextOpenRow)
                {
                    tiles[column, nextOpenRow] = tile;
                    tiles[column, row] = null;
                    tile.SetGridPosition(column, nextOpenRow);
                    animations.Add(tile.AnimateMove(GetTilePosition(column, nextOpenRow)));
                }

                nextOpenRow++;
            }

            for (int row = nextOpenRow; row < height; row++)
            {
                TileView tile = CreateOrReuseTile(column, row, GetRandomColorId());
                Vector2 targetPosition = GetTilePosition(column, row);
                Vector2 startPosition = targetPosition + Vector2.up * ((height - nextOpenRow + 1) * (tileSize + tileGap));
                tiles[column, row] = tile;
                animations.Add(tile.AnimateSpawn(startPosition, targetPosition));
            }
        }

        foreach (IEnumerator animation in animations)
        {
            StartCoroutine(animation);
        }

        yield return new WaitForSeconds(0.18f);
    }

    private void EnsurePlayableBoard()
    {
        if (HasAnyAvailableGroup())
        {
            return;
        }

        ReshuffleBoardUntilPlayable();
    }

    private void ReshuffleBoardUntilPlayable()
    {
        int guard = 0;
        while (!HasAnyAvailableGroup() && guard < 128)
        {
            guard++;
            for (int column = 0; column < width; column++)
            {
                for (int row = 0; row < height; row++)
                {
                    TileView tile = tiles[column, row];
                    if (tile == null)
                    {
                        continue;
                    }

                    TileColorId newColor = GetRandomColorId();
                    tile.SetColor(newColor, GetTileColor(newColor));
                    tile.ResetVisualState();
                }
            }
        }
    }

    private List<TileView> FindConnectedGroup(int startColumn, int startRow)
    {
        List<TileView> result = new List<TileView>();
        if (!IsInBounds(startColumn, startRow) || tiles[startColumn, startRow] == null)
        {
            return result;
        }

        TileColorId targetColor = tiles[startColumn, startRow].ColorId;
        bool[,] visited = new bool[width, height];
        Queue<Vector2Int> frontier = new Queue<Vector2Int>();
        frontier.Enqueue(new Vector2Int(startColumn, startRow));
        visited[startColumn, startRow] = true;

        while (frontier.Count > 0)
        {
            Vector2Int current = frontier.Dequeue();
            TileView currentTile = tiles[current.x, current.y];
            if (currentTile == null || currentTile.ColorId != targetColor)
            {
                continue;
            }

            result.Add(currentTile);

            foreach (Vector2Int direction in directions)
            {
                Vector2Int next = current + direction;
                if (!IsInBounds(next.x, next.y) || visited[next.x, next.y])
                {
                    continue;
                }

                TileView nextTile = tiles[next.x, next.y];
                if (nextTile == null || nextTile.ColorId != targetColor)
                {
                    continue;
                }

                visited[next.x, next.y] = true;
                frontier.Enqueue(next);
            }
        }

        return result;
    }

    private bool HasAnyAvailableGroup()
    {
        bool[,] visited = new bool[width, height];
        for (int column = 0; column < width; column++)
        {
            for (int row = 0; row < height; row++)
            {
                if (visited[column, row] || tiles[column, row] == null)
                {
                    continue;
                }

                int matchCount = CountConnectedTiles(column, row, visited);
                if (matchCount >= 2)
                {
                    return true;
                }
            }
        }

        return false;
    }

    private int CountConnectedTiles(int startColumn, int startRow, bool[,] visited)
    {
        TileView startTile = tiles[startColumn, startRow];
        if (startTile == null)
        {
            return 0;
        }

        int count = 0;
        Queue<Vector2Int> frontier = new Queue<Vector2Int>();
        frontier.Enqueue(new Vector2Int(startColumn, startRow));
        visited[startColumn, startRow] = true;

        while (frontier.Count > 0)
        {
            Vector2Int current = frontier.Dequeue();
            TileView currentTile = tiles[current.x, current.y];
            if (currentTile == null || currentTile.ColorId != startTile.ColorId)
            {
                continue;
            }

            count++;
            foreach (Vector2Int direction in directions)
            {
                Vector2Int next = current + direction;
                if (!IsInBounds(next.x, next.y) || visited[next.x, next.y])
                {
                    continue;
                }

                TileView nextTile = tiles[next.x, next.y];
                if (nextTile == null || nextTile.ColorId != startTile.ColorId)
                {
                    continue;
                }

                visited[next.x, next.y] = true;
                frontier.Enqueue(next);
            }
        }

        return count;
    }

    private TileView CreateOrReuseTile(int column, int row, TileColorId colorId)
    {
        TileView tile;
        if (recycledTiles.Count > 0)
        {
            tile = recycledTiles.Dequeue();
            tile.gameObject.SetActive(true);
        }
        else
        {
            GameObject tileObject = new GameObject(string.Format("Tile_{0}_{1}", column, row));
            tileObject.transform.SetParent(boardRoot, false);
            tile = tileObject.AddComponent<TileView>();
        }

        tile.transform.SetParent(boardRoot, false);
        tile.Initialize(this, column, row, colorId, Vector2.one * tileSize, tileSprite);
        return tile;
    }

    private void ReleaseTile(TileView tile)
    {
        tile.ResetVisualState();
        tile.gameObject.SetActive(false);
        recycledTiles.Enqueue(tile);
    }

    private void ClearBoard()
    {
        for (int column = 0; column < width; column++)
        {
            for (int row = 0; row < height; row++)
            {
                if (tiles[column, row] != null)
                {
                    ReleaseTile(tiles[column, row]);
                    tiles[column, row] = null;
                }
            }
        }
    }

    private Vector2 GetTilePosition(int column, int row)
    {
        float stride = tileSize + tileGap;
        float x = column * stride - ((width - 1) * stride * 0.5f);
        float y = row * stride - ((height - 1) * stride * 0.5f);
        return new Vector2(x, y);
    }

    private TileColorId GetRandomColorId()
    {
        return (TileColorId)Random.Range(0, Mathf.Clamp(colorCount, 1, 5));
    }

    private bool IsInBounds(int column, int row)
    {
        return column >= 0 && column < width && row >= 0 && row < height;
    }
}
