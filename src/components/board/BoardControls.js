const BoardControls = ({
    selectedBoard,
    onChangeBoard,
    sortOrder,
    onChangeSort,
    searchQuery,
    onChangeSearch,
    onClickWrite,
    profile,
}) => {
    return (
        <div className="board-controls">
            <div className="left-controls">
                <select value={selectedBoard} onChange={(e) => onChangeBoard(e.target.value)}>
                    <option value="general">일반 게시판</option>
                    <option value="admin">관리자 게시판</option>
                </select>

                <select value={sortOrder} onChange={(e) => onChangeSort(e.target.value)}>
                    <option value="newest">최신순</option>
                    <option value="oldest">오래된순</option>
                </select>
            </div>

            <div className="right-controls">
                <input
                    type="text"
                    placeholder="검색어 입력"
                    value={searchQuery}
                    onChange={(e) => onChangeSearch(e.target.value)}
                />
                {profile && <button onClick={onClickWrite}>작성하기</button>}
            </div>
        </div>
    );
};

export default BoardControls;
