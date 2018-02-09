import RESOURCE_MANAGER from "../../../../@localization";
import { IList } from "sp-pnp-provisioning/lib/schema";
import SiteFields from "./SiteFields";

export default function BenefitsFollowup(language: number): IList {
    const { GtGainLookup, GtMeasureIndicatorLookup, GtGainLookup_ID } = SiteFields(language);
    return {
        Title: RESOURCE_MANAGER.getResource("Lists_BenefitsFollowup_Title", language),
        Description: "",
        Template: 100,
        ContentTypesEnabled: true,
        RemoveExistingContentTypes: true,
        ContentTypeBindings: [{
            ContentTypeID: "0x01007A831AC68204F04AAA022CFF06C7BAA2",
        }],
        AdditionalSettings: {
            EnableVersioning: true,
        },
        FieldRefs: [{
            ID: "fa564e0f-0c70-4ab9-b863-0177e6ddd247",
            Required: false,
            Hidden: true,
        }],
        Fields: [
            GtGainLookup,
            GtMeasureIndicatorLookup,
            GtGainLookup_ID,
        ],
        Views: [{
            Title: RESOURCE_MANAGER.getResource("View_AllItems_DisplayName", language),
            ViewFields: ["GtMeasurementDate", "GtMeasurementValue", "GtMeasureIndicatorLookup", "GtMeasurementComment"],
            AdditionalSettings: {
                RowLimit: 30,
                Paged: true,
                ViewQuery: `<GroupBy Collapse="TRUE" GroupLimit="30">
                            <FieldRef Name="GtGainLookup" />
                        </GroupBy>
                        <OrderBy>
                            <FieldRef Name="GtMeasurementDate" Ascending="FALSE" />
                        </OrderBy>`,
            },
        },
        {
            Title: RESOURCE_MANAGER.getResource("View_Flat_DisplayName", language),
            ViewFields: ["GtGainLookup", "GtMeasurementDate", "GtMeasurementValue", "GtMeasureIndicatorLookup", "GtMeasurementComment"],
            AdditionalSettings: {
                RowLimit: 30,
                Paged: true,
                ViewQuery: `<OrderBy>
                            <FieldRef Name="GtGainLookup" />
                            <FieldRef Name="GtMeasurementDate" Ascending="FALSE" />
                        </OrderBy>`,
            },
        }],
    };
}
