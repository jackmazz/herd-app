import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EditCommunityEditor } from "./EditCommunityModal";

export default function EditCommunityPage() {
  const navigate = useNavigate();
  const { groupID } = useParams();

  const token = sessionStorage.getItem("user-token") || "";
  const userId = String(sessionStorage.getItem("user") || "");

  const backToCommunity = () => navigate(`/community/${groupID}`);

  return (
    <div className="createCommunityPage">
      <div className="createCommunityCard">
        <EditCommunityEditor
          groupID={groupID}
          token={token}
          userId={userId}
          onCancel={backToCommunity}
          onUpdated={backToCommunity}
        />
      </div>
    </div>
  );
}
